"""tasks/views_report.py"""

import csv

from django.db.models import Count
from django.http import HttpResponse
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from tasks.models import Task


class MonthlyReportView(APIView):
    """Ежемесячный отчёт по задачам."""

    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """Обрабатывает GET-запрос."""

        user_param = request.query_params.get("user")
        month_str = request.query_params.get("month")
        fmt = request.query_params.get("format")

        # пока поддерживаем только user=me
        if user_param != "me":
            return Response(
                {"detail": "Пока поддерживается только user=me."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not month_str:
            return Response(
                {"detail": "Параметр month обязателен (формат YYYY-MM)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # парсим месяц 'YYYY-MM'
        try:
            year_str, month_num_str = month_str.split("-")
            year = int(year_str)
            month = int(month_num_str)
        except (ValueError, AttributeError):
            return Response(
                {"detail": "month должен быть в формате YYYY-MM."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not 1 <= month <= 12:
            return Response(
                {"detail": "month должен быть в диапазоне 1-12."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        assignee = request.user

        qs = Task.objects.filter(
            assignee=assignee,
            due_at__year=year,
            due_at__month=month,
        )

        total = qs.count()

        # словарь счётчиков по статусам, изначально всё по нулям
        by_status = {status_value: 0 for status_value, _ in Task.Status.choices}

        # группируем по статусу и считаем количество
        for row in qs.values("status").annotate(cnt=Count("id")):
            by_status[row["status"]] = row["cnt"]

        # CSV-ответ
        if fmt == "csv":
            response = HttpResponse(content_type="text/csv")
            response["Content-Disposition"] = (
                f'attachment; filename="monthly_report_{month_str}.csv"'
            )

            writer = csv.writer(response)
            writer.writerow(
                ["user_id", "month", "total", "done", "new", "in_progress", "overdue"]
            )
            writer.writerow(
                [
                    assignee.id,
                    month_str,
                    total,
                    by_status.get(Task.Status.DONE, 0),
                    by_status.get(Task.Status.NEW, 0),
                    by_status.get(Task.Status.IN_PROGRESS, 0),
                    by_status.get(Task.Status.OVERDUE, 0),
                ]
            )
            return response

        # JSON-ответ
        data = {
            "user_id": assignee.id,
            "month": month_str,
            "total": total,
            "by_status": by_status,
        }
        return Response(data, status=status.HTTP_200_OK)
