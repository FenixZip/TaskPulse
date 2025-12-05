"""tasks/views_cabinet.py"""
from typing import Any, Dict, List

from django.db.models import Count, Q, F
from rest_framework import status
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User  # твой кастомный User
from .models import Task
from .serializers_cabinet import (
    CreatorTaskListSerializer,
    ExecutorTaskListSerializer,
    ExecutorTaskDetailSerializer,
)


class CreatorOnlyMixin:
    """Миксин для проверки, что текущий юзер — CREATOR."""

    def _ensure_creator(self, request) -> Response | None:
        if getattr(request.user, "role", None) != User.Role.CREATOR:
            return Response(
                {"detail": "Доступ только для пользователей с ролью CREATOR."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return None


class CreatorTasksView(CreatorOnlyMixin, ListAPIView):
    """
    Кабинет Создателя: список собственных задач.
    Фильтры:
    - status=...
    - assignee=ID (или 'me' в будущем)
    - ordering=due_at / -due_at / priority / -priority / status / -status / updated_at / -updated_at
    """

    permission_classes = [IsAuthenticated]
    serializer_class = CreatorTaskListSerializer

    def get(self, request, *args, **kwargs):
        err = self._ensure_creator(request)
        if err is not None:
            return err
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        user = self.request.user
        qs = Task.objects.filter(creator=user).select_related("assignee")

        status_param = self.request.query_params.get("status")
        assignee_param = self.request.query_params.get("assignee")
        ordering = self.request.query_params.get("ordering")

        if status_param:
            qs = qs.filter(status=status_param)

        if assignee_param:
            if assignee_param == "none":
                qs = qs.filter(assignee__isnull=True)
            else:
                try:
                    qs = qs.filter(assignee_id=int(assignee_param))
                except ValueError:
                    pass

        allowed_ordering = {
            "due_at",
            "-due_at",
            "priority",
            "-priority",
            "status",
            "-status",
            "updated_at",
            "-updated_at",
        }
        if ordering in allowed_ordering:
            qs = qs.order_by(ordering)

        return qs


class CreatorStatsByAssigneeView(CreatorOnlyMixin, APIView):
    """
    Кабинет Создателя: сводка по сотрудникам.
    GET /api/me/creator/stats-by-assignee/?month=YYYY-MM (опционально)
    Возвращает по каждому исполнителю:
    - assignee_id, assignee_email, assignee_name
    - total / done / done_on_time / done_late
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        err = self._ensure_creator(request)
        if err is not None:
            return err

        month_str = request.query_params.get("month")

        qs = Task.objects.filter(creator=request.user, assignee__isnull=False)

        # фильтр по месяцу дедлайна (как и в отчётах)
        if month_str:
            try:
                year_str, month_num_str = month_str.split("-")
                year = int(year_str)
                month = int(month_num_str)
                if 1 <= month <= 12:
                    qs = qs.filter(due_at__year=year, due_at__month=month)
            except (ValueError, AttributeError):
                return Response(
                    {"detail": "month должен быть в формате YYYY-MM."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Базовая группировка по исполнителю
        base = (
            qs.values("assignee_id", "assignee__email", "assignee__full_name")
            .annotate(total=Count("id"))
            .order_by("assignee__full_name")
        )

        # Для done_on_time / done_late сделаем отдельные queryset и соберём словари
        done_qs = qs.filter(status=Task.Status.DONE)
        done_on_time_qs = done_qs.filter(
            Q(due_at__isnull=True) | Q(updated_at__lte=F("due_at"))
        )
        done_late_qs = done_qs.filter(
            Q(due_at__isnull=False) & Q(updated_at__gt=F("due_at"))
        )

        done_map = {
            row["assignee_id"]: row["cnt"]
            for row in done_qs.values("assignee_id").annotate(cnt=Count("id"))
        }
        done_on_time_map = {
            row["assignee_id"]: row["cnt"]
            for row in done_on_time_qs.values("assignee_id").annotate(cnt=Count("id"))
        }
        done_late_map = {
            row["assignee_id"]: row["cnt"]
            for row in done_late_qs.values("assignee_id").annotate(cnt=Count("id"))
        }

        result: List[Dict[str, Any]] = []
        for row in base:
            aid = row["assignee_id"]
            result.append(
                {
                    "assignee_id": aid,
                    "assignee_email": row["assignee__email"],
                    "assignee_name": row["assignee__full_name"],
                    "total": row["total"],
                    "done": done_map.get(aid, 0),
                    "done_on_time": done_on_time_map.get(aid, 0),
                    "done_late": done_late_map.get(aid, 0),
                }
            )

        return Response({"results": result}, status=status.HTTP_200_OK)


class ExecutorTasksView(ListAPIView):
    """
    Кабинет Исполнителя: список назначенных задач.
    Фильтры:
    - status=...
    - ordering=due_at / -due_at / priority / -priority / updated_at / -updated_at
    """

    permission_classes = [IsAuthenticated]
    serializer_class = ExecutorTaskListSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Task.objects.filter(assignee=user).select_related("creator")

        status_param = self.request.query_params.get("status")
        ordering = self.request.query_params.get("ordering")

        if status_param:
            qs = qs.filter(status=status_param)

        allowed_ordering = {
            "due_at",
            "-due_at",
            "priority",
            "-priority",
            "updated_at",
            "-updated_at",
        }
        if ordering in allowed_ordering:
            qs = qs.order_by(ordering)

        return qs


class ExecutorTaskDetailView(RetrieveAPIView):
    """
    Детальная карточка задачи для Исполнителя:
    - основная инфа
    - вложения
    - история действий (TaskActionLog)
    """

    permission_classes = [IsAuthenticated]
    serializer_class = ExecutorTaskDetailSerializer
    queryset = Task.objects.all().prefetch_related("attachments", "actions")

    def get_object(self):
        obj = super().get_object()
        # Исполнитель видит только свои задачи
        if obj.assignee_id != self.request.user.id:
            # Можно вернуть 404, чтобы не палить ID
            from rest_framework.exceptions import NotFound

            raise NotFound("Задача не найдена.")
        return obj
