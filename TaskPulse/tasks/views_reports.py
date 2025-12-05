"""tasks/views_reports.py"""

import csv

from django.contrib.auth import get_user_model
from django.http import HttpResponse
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, renderer_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.renderers import JSONRenderer, BrowsableAPIRenderer, BaseRenderer
from rest_framework.response import Response

from .services.kpi import calc_user_month_kpi


User = get_user_model()


class CSVRenderer(BaseRenderer):
    """
    Простейший рендерер, который говорит DRF, что формат `csv` существует.
    Фактическую генерацию CSV делаем вручную через HttpResponse.
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
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer, BrowsableAPIRenderer, CSVRenderer])
def monthly_report(request):
    """
    Отчёт по задачам исполнителя за месяц.

    Параметры:
    - ?user=me (по умолчанию) или ?user=<id>;
    - ?month=YYYY-MM (обязателен);
    - ?format=json (по умолчанию) или ?format=csv.
    """

    current_user = request.user
    if getattr(current_user, "role", None) != "CREATOR":
        return Response(
            {"detail": "Доступ к отчётам есть только у пользователей с ролью CREATOR."},
            status=status.HTTP_403_FORBIDDEN,
        )

    user_param = request.query_params.get("user", "me")
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

    if user_param == "me":
        target_user = current_user
    else:
        try:
            target_user = User.objects.get(pk=user_param)
        except User.DoesNotExist:
            return Response(
                {"detail": "Пользователь не найден."},
                status=status.HTTP_404_NOT_FOUND,
            )

    # --- KPI считаем через сервисный слой ---
    data = calc_user_month_kpi(target_user, year, month)

    if fmt == "csv":
        # CSV-ответ
        response = HttpResponse(content_type="text/csv")
        filename = f"monthly_report_{data['user_id']}_{data['month']}.csv"
        response["Content-Disposition"] = f'attachment; filename=\"{filename}\"'

        writer = csv.writer(response)
        writer.writerow(["user_id", "month", "total", "done", "done_on_time", "done_late"])
        writer.writerow([
            data["user_id"],
            data["month"],
            data["total"],
            data["done"],
            data["done_on_time"],
            data["done_late"],
        ])

        writer.writerow([])
        writer.writerow(["priority", "total", "done", "done_on_time", "done_late"])
        for item in data["by_priority"]:
            writer.writerow([
                item["priority"],
                item["total"],
                item["done"],
                item["done_on_time"],
                item["done_late"],
            ])

        return response

    # JSON-ответ
    return Response(data, status=status.HTTP_200_OK)
