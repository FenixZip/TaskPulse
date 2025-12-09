"""tasks/views.py"""

from datetime import timedelta

from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from django.contrib.auth import get_user_model

from .filters import TaskFilter
from .models import Task, TaskChangeLog, TaskMessage
from .permissions import IsCreatorOrAssignee
from .serializers import (
    TaskActionSerializer,
    TaskAttachmentSerializer,
    TaskSerializer,
    TaskUpsertSerializer,
    TaskMessageSerializer,
)

User = get_user_model()


class TaskViewSet(viewsets.ModelViewSet):
    """
    Полноценный вьюсет для задач:
    - GET /api/tasks/                    — список с фильтрами/поиском
    - POST /api/tasks/                   — создать (creator = request.user)
    - GET /api/tasks/{id}/               — детально
    - PATCH /api/tasks/{id}/             — частичное изменение
    - POST /api/tasks/{id}/attachments/  — загрузить файл к задаче
    - POST /api/tasks/{id}/confirm-on-time — действие “сделаю вовремя”
    - POST /api/tasks/{id}/extend-1d     — действие “продлить на сутки”
    """

    queryset = Task.objects.select_related("creator", "assignee").prefetch_related(
        "attachments"
    )
    permission_classes = [permissions.IsAuthenticated, IsCreatorOrAssignee]
    serializer_class = TaskSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = TaskFilter
    search_fields = ["title", "description"]
    ordering_fields = ["due_at", "updated_at", "created_at", "priority", "status"]
    ordering = ["-updated_at"]

    def get_queryset(self):
        qs = (
            super()
            .get_queryset()
            .select_related("creator", "assignee")
            .prefetch_related("attachments", "changes", "actions")
        )
        return qs

    def get_serializer_class(self):
        """
        Возвращает сериализатор в зависимости от действия
        (list/retrieve vs create/update).
        """
        if self.action in ("create", "update", "partial_update"):
            return TaskUpsertSerializer
        return TaskSerializer

    def get_permissions(self):
        """Настраиваем права доступа."""
        if self.action in ("list", "create"):
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsCreatorOrAssignee()]

    def create(self, request, *args, **kwargs):
        """
        Создаёт задачу через upsert-сериализатор,
        а отдаёт read-сериализатор (с полем creator и вложениями).
        """
        upsert = TaskUpsertSerializer(data=request.data, context={"request": request})
        upsert.is_valid(raise_exception=True)
        task = upsert.save()
        read = TaskSerializer(task, context={"request": request})
        return Response(read.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="attachments")
    def upload_attachment(self, request, pk=None):
        """POST /api/tasks/{id}/attachments/"""
        task = self.get_object()
        ser = TaskAttachmentSerializer(data=request.data, context={"request": request})
        ser.is_valid(raise_exception=True)
        ser.save(task=task)
        return Response(ser.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="confirm-on-time")
    def confirm_on_time(self, request, pk=None):
        """
        POST /api/tasks/{id}/confirm-on-time
        Исполнитель подтверждает, что уложится в срок.
        Запишем событие в журнал.
        """
        task = self.get_object()
        if task.assignee_id != request.user.id:
            return Response(
                {"detail": "Доступно только исполнителю задачи."},
                status=status.HTTP_403_FORBIDDEN,
            )

        ser = TaskActionSerializer(
            data=request.data,
            context={"request": request, "action": "confirm_on_time"},
        )
        ser.is_valid(raise_exception=True)

        TaskChangeLog.log(
            task=task,
            changed_by=request.user,
            field="confirm_on_time",
            old_value="false",
            new_value="true",
            reason=ser.validated_data.get("comment", "Подтверждение сроков"),
        )
        return Response({"ok": True}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="extend-1d")
    def extend_1d(self, request, pk=None):
        """
        POST /api/tasks/{id}/extend-1d
        Продлевает дедлайн задачи на сутки. Комментарий обязателен.
        """
        task = self.get_object()
        if task.assignee_id != request.user.id:
            return Response(
                {"detail": "Доступно только исполнителю задачи."},
                status=status.HTTP_403_FORBIDDEN,
            )

        ser = TaskActionSerializer(
            data=request.data,
            context={"request": request, "action": "extend_1d"},
        )
        ser.is_valid(raise_exception=True)

        old_due = task.due_at.isoformat() if task.due_at else None
        task.due_at = (task.due_at or timezone.now()) + timedelta(days=1)
        task.save(update_fields=["due_at", "updated_at"])

        TaskChangeLog.log(
            task=task,
            changed_by=request.user,
            field="due_at",
            old_value=old_due,
            new_value=task.due_at.isoformat(),
            reason=ser.validated_data["comment"],
        )
        return Response(
            TaskSerializer(task, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )


class ConversationMessagesView(APIView):
    """
    Общий диалог между текущим пользователем и другим пользователем (создатель ↔ исполнитель)
    по всем задачам сразу.

    GET /api/tasks/conversation-messages/?user_id=<id>

    POST /api/tasks/conversation-messages/
      data:
        - user_id: id собеседника (создатель/исполнитель)
        - task: id задачи, к которой относится сообщение (опционально)
        - text: текст (опционально)
        - file: файл (опционально, multipart/form-data)
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        other_id = request.query_params.get("user_id")

        if not other_id:
            return Response(
                {"detail": "Нужно указать user_id."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            other_id = int(other_id)
        except ValueError:
            return Response(
                {"detail": "Некорректный user_id."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            other = User.objects.get(pk=other_id)
        except User.DoesNotExist:
            return Response(
                {"detail": "Пользователь не найден."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Все сообщения по задачам, где user и other связаны как создатель/исполнитель
        qs = (
            TaskMessage.objects.filter(
                Q(task__creator=user, task__assignee=other)
                | Q(task__creator=other, task__assignee=user)
            )
            .select_related("sender", "task")
            .order_by("created_at", "id")
        )

        # ВАЖНО: даже если сообщений нет — возвращаем 200 и []
        serializer = TaskMessageSerializer(
            qs, many=True, context={"request": request}
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        user = request.user
        other_id = request.data.get("user_id")
        task_id = request.data.get("task")

        if not other_id:
            return Response(
                {"detail": "Нужно указать user_id."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            other_id = int(other_id)
        except (TypeError, ValueError):
            return Response(
                {"detail": "Некорректный user_id."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            other = User.objects.get(pk=other_id)
        except User.DoesNotExist:
            return Response(
                {"detail": "Пользователь не найден."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # --- выбираем задачу ---
        task: Task | None = None

        if task_id:
            try:
                task_id_int = int(task_id)
            except (TypeError, ValueError):
                return Response(
                    {"detail": "Некорректный task."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            try:
                task = Task.objects.get(pk=task_id_int)
            except Task.DoesNotExist:
                return Response(
                    {"detail": "Задача не найдена."},
                    status=status.HTTP_404_NOT_FOUND,
                )
        else:
            # Если task не передали — пробуем найти единственную общую задачу
            tasks_qs = Task.objects.filter(
                Q(creator=user, assignee=other)
                | Q(creator=other, assignee=user)
            )
            count = tasks_qs.count()
            if count == 0:
                return Response(
                    {"detail": "Нет общей задачи для чата."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            elif count > 1:
                return Response(
                    {"detail": "Нужно явно указать task для сообщения."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            task = tasks_qs.first()

        # --- проверяем доступ ---
        if not (
            (task.creator_id == user.id and task.assignee_id == other.id)
            or (task.creator_id == other.id and task.assignee_id == user.id)
        ):
            return Response(
                {"detail": "Нет доступа к чату по этой задаче."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # --- создаём сообщение ---
        serializer = TaskMessageSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        message = serializer.save(task=task, sender=user)

        out = TaskMessageSerializer(message, context={"request": request})
        return Response(out.data, status=status.HTTP_201_CREATED)