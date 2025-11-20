"""tasks/views_reports.py"""

import csv
from typing import Dict, Any, List

from django.contrib.auth import get_user_model
from django.db.models import Q, F
from django.http import HttpResponse
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, renderer_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.renderers import JSONRenderer, BrowsableAPIRenderer, BaseRenderer
from rest_framework.response import Response

from .models import Task

User = get_user_model()


class CSVRenderer(BaseRenderer):
    """
    Простейший рендерер, чтобы DRF не падал на ?format=csv.
    Мы возвращаем HttpResponse сами, поэтому сюда выполнение
    фактически не доходит, но наличие рендерера делает формат `csv`
    "разрешённым" для DRF.
    """

    media_type = "text/csv"
    format = "csv"

    def render(self, data, accepted_media_type=None, renderer_context=None):
        if data is None:
            return b""
        if isinstance(data, bytes):
            return data
        if isinstance(data, str):
            return data.encode("utf-8")
        return str(data).encode("utf-8")


def _parse_month(month_str: str):
    """Разбирает строку YYYY-MM в (year, month_int) или возвращает (None, None) при ошибке."""

    if not month_str:
        return None, None
    try:
        year_str, month_num_str = month_str.split("-")
        year = int(year_str)
        month = int(month_num_str)
    except (ValueError, AttributeError):
        return None, None
    if not 1 <= month <= 12:
        return None, None
    return year, month


@api_view(["GET"])
@renderer_classes([JSONRenderer, CSVRenderer, BrowsableAPIRenderer])
@permission_classes([IsAuthenticated])
def monthly_report(request):
    """
    Ежемесячный отчёт по задачам сотрудника.
    Ограничения:
    - доступ только для пользователей с ролью CREATOR;
    - user=me или user={id сотрудника};
    - month в формате YYYY-MM;
    - ?format=json (по умолчанию) или ?format=csv.
    """

    # --- 1. Проверяем роль пользователя ---
    current_user = request.user
    if getattr(current_user, "role", None) != "CREATOR":
        return Response(
            {"detail": "Доступ к отчётам есть только у пользователей с ролью CREATOR."},
            status=status.HTTP_403_FORBIDDEN,
        )

    # --- 2. Разбор параметров ---
    user_param = request.query_params.get("user")
    month_str = request.query_params.get("month")
    fmt = request.query_params.get("format", "json").lower()

    if not month_str:
        return Response(
            {"detail": "Параметр month обязателен (формат YYYY-MM)."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    year, month = _parse_month(month_str)
    if year is None:
        return Response(
            {"detail": "month должен быть в формате YYYY-MM и с допустимым номером месяца."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # --- 3. Определяем сотрудника, по которому строим отчёт ---
    if user_param in ("me", None):
        target_user = current_user
    else:
        try:
            target_id = int(user_param)
        except (TypeError, ValueError):
            return Response(
                {"detail": "Параметр user должен быть 'me' или числовым id пользователя."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            target_user = User.objects.get(id=target_id)
        except User.DoesNotExist:
            return Response(
                {"detail": "Пользователь с таким id не найден."},
                status=status.HTTP_404_NOT_FOUND,
            )

    # --- 4. Базовый queryset задач ---
    qs = Task.objects.filter(
        assignee=target_user,
        due_at__year=year,
        due_at__month=month,
    )

    # --- 5. KPI по задачам ---
    total = qs.count()

    done_qs = qs.filter(status=Task.Status.DONE)
    done = done_qs.count()

    # В срок: DONE и (due_at IS NULL или updated_at <= due_at)
    done_on_time = done_qs.filter(
        Q(due_at__isnull=True) | Q(updated_at__lte=F("due_at"))
    ).count()

    # С опозданием: DONE и updated_at > due_at (и due_at не NULL)
    done_late = done_qs.filter(
        Q(due_at__isnull=False) & Q(updated_at__gt=F("due_at"))
    ).count()

    # --- 6. KPI по приоритетам ---
    by_priority_list: List[Dict[str, Any]] = []
    for priority_value, _priority_label in Task.Priority.choices:
        prio_qs = qs.filter(priority=priority_value)
        prio_done_qs = prio_qs.filter(status=Task.Status.DONE)

        prio_total = prio_qs.count()
        prio_done = prio_done_qs.count()
        prio_done_on_time = prio_done_qs.filter(
            Q(due_at__isnull=True) | Q(updated_at__lte=F("due_at"))
        ).count()
        prio_done_late = prio_done_qs.filter(
            Q(due_at__isnull=False) & Q(updated_at__gt=F("due_at"))
        ).count()

        by_priority_list.append(
            {
                "priority": priority_value,
                "total": prio_total,
                "done": prio_done,
                "done_on_time": prio_done_on_time,
                "done_late": prio_done_late,
            }
        )

    # --- 7. CSV-экспорт ---
    if fmt == "csv":
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = (
            f'attachment; filename="monthly_report_{month_str}_{target_user.id}.csv"'
        )

        writer = csv.writer(response)
        writer.writerow(
            ["user_id", "month", "total", "done", "done_on_time", "done_late"]
        )
        writer.writerow(
            [target_user.id, month_str, total, done, done_on_time, done_late]
        )
        return response

    # --- 8. JSON-ответ ---
    data = {
        "user_id": target_user.id,
        "month": month_str,
        "total": total,
        "done": done,
        "done_on_time": done_on_time,
        "done_late": done_late,
        "by_priority": by_priority_list,
    }
    return Response(data, status=status.HTTP_200_OK)
