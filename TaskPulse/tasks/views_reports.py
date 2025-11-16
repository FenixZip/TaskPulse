# импорт базового APIView
from rest_framework.views import APIView
# импорт пермишена: только авторизованные
from rest_framework.permissions import IsAuthenticated
# стандартный DRF-ответ для JSON
from rest_framework.response import Response

# обычный Django HttpResponse — пригодится для CSV
from django.http import HttpResponse

# утилиты времени
# для агрегаций по статусам
from django.db.models import Count

# стандартный модуль csv
import csv

# импорт модели задач
from tasks.models import Task


class MonthlyReportView(APIView):
    """
    Ежемесячный отчёт по задачам.

    Поддерживает:
    - GET /api/reports/monthly/?user=me&month=YYYY-MM          -> JSON
    - GET /api/reports/monthly/?user=me&month=YYYY-MM&format=csv -> CSV
    """

    # доступ только для авторизованных
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """
        Обрабатывает GET-запрос.

        Query-параметры:
        - user: сейчас поддерживаем только 'me' (текущий пользователь).
        - month: строка 'YYYY-MM', например '2025-11'.
        - format: опционально; если 'csv' — вернуть CSV.
        """

        # достаём параметры запроса
        user_param = request.query_params.get("user")
        month_str = request.query_params.get("month")
        fmt = request.query_params.get("format")

        # пока поддерживаем только user=me
        if user_param != "me":
            return Response({"detail": "Пока поддерживается только user=me."}, status=400)

        # month обязателен
        if not month_str:
            return Response({"detail": "Параметр month обязателен (формат YYYY-MM)."}, status=400)

        # парсим месяц 'YYYY-MM'
        try:
            year_str, month_num_str = month_str.split("-")
            year = int(year_str)
            month = int(month_num_str)
        except (ValueError, AttributeError):
            return Response({"detail": "month должен быть в формате YYYY-MM."}, status=400)

        # текущий пользователь — исполнитель
        assignee = request.user

        # фильтр по исполнителю и по году/месяцу дедлайна
        # (так не паримся с часовыми поясами)
        qs = Task.objects.filter(
            assignee=assignee,
            due_at__year=year,
            due_at__month=month,
        )

        # общее количество задач
        total = qs.count()

        # словарь счётчиков по статусам, изначально всё по нулям
        by_status = {status_value: 0 for status_value, _ in Task.Status.choices}

        # группируем по статусу и считаем количество
        for row in qs.values("status").annotate(cnt=Count("id")):
            by_status[row["status"]] = row["cnt"]

        # ───────────────── CSV-ответ ─────────────────
        if fmt == "csv":
            # создаём HttpResponse с типом text/csv
            response = HttpResponse(content_type="text/csv")
            # заголовок, чтобы браузер видел это как файл
            response["Content-Disposition"] = (
                f'attachment; filename="monthly_report_{month_str}.csv"'
            )

            # csv.writer будет писать прямо в HttpResponse
            writer = csv.writer(response)

            # заголовок CSV
            writer.writerow(["user_id", "month", "total", "done", "new", "in_progress", "overdue"])

            # одна строка с данными по текущему пользователю
            writer.writerow([
                assignee.id,
                month_str,
                total,
                by_status.get(Task.Status.DONE, 0),
                by_status.get(Task.Status.NEW, 0),
                by_status.get(Task.Status.IN_PROGRESS, 0),
                by_status.get(Task.Status.OVERDUE, 0),
            ])

            return response

        # ───────────────── JSON-ответ (как раньше) ─────────────────
        data = {
            "user_id": assignee.id,
            "month": month_str,
            "total": total,
            "by_status": by_status,
        }
        return Response(data)
