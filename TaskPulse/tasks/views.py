"""tasks/views.py"""

from datetime import timedelta

from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.response import Response

from .filters import TaskFilter
from .models import Task, TaskChangeLog
from .permissions import IsCreatorOrAssignee
from .serializers import (
    TaskActionSerializer,
    TaskAttachmentSerializer,
    TaskSerializer,
    TaskUpsertSerializer,
)


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
        """Возвращает сериализатор в зависимости от действия (list/retrieve vs create/update)."""

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
            old_value=None,
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
