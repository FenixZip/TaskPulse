"""tests/accounts/test_reports_kpi.py"""
import csv
import io
from datetime import timedelta

import pytest
from django.urls import reverse
from django.utils import timezone

from tasks.models import Task


@pytest.mark.django_db
def test_monthly_report_only_for_creators(api_client, executor):
    """Исполнитель (EXECUTOR) не должен иметь доступа к отчётам."""

    now = timezone.now()
    month_str = now.strftime("%Y-%m")
    url = reverse("reports-monthly") + f"?user=me&month={month_str}"

    from rest_framework.authtoken.models import Token

    token, _ = Token.objects.get_or_create(user=executor)
    api_client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    resp = api_client.get(url)
    assert resp.status_code == 403


@pytest.mark.django_db
def test_monthly_report_kpi_json(auth_client, creator, executor):
    """
    Проверяем базовые KPI по JSON-ответу:
    - считаются только задачи выбранного месяца;
    - корректно считаются total/done/done_on_time/done_late;
    - есть агрегаты по приоритетам.
    """

    now = timezone.now()
    month_str = now.strftime("%Y-%m")

    # задача, выполненная В СРОК
    on_time = Task.objects.create(
        title="On time",
        description="",
        priority=Task.Priority.HIGH,
        status=Task.Status.DONE,
        creator=creator,
        assignee=executor,
        due_at=now + timedelta(days=1),
    )
    on_time.updated_at = on_time.due_at - timedelta(hours=1)
    on_time.save(update_fields=["updated_at"])

    # задача, выполненная ПОЗЖЕ срока
    late = Task.objects.create(
        title="Late",
        description="",
        priority=Task.Priority.HIGH,
        status=Task.Status.DONE,
        creator=creator,
        assignee=executor,
        due_at=now + timedelta(days=1),
    )
    late.updated_at = late.due_at + timedelta(hours=1)
    late.save(update_fields=["updated_at"])

    # задача с дедлайном в другом месяце — не должна войти в отчёт
    Task.objects.create(
        title="Other month",
        description="",
        priority=Task.Priority.HIGH,
        status=Task.Status.DONE,
        creator=creator,
        assignee=executor,
        due_at=now + timedelta(days=40),
    )

    url = reverse("reports-monthly") + f"?user={executor.id}&month={month_str}"
    resp = auth_client.get(url)
    assert resp.status_code == 200, resp.content

    data = resp.json()
    assert data["user_id"] == executor.id
    assert data["month"] == month_str
    assert data["total"] == 2
    assert data["done"] == 2
    assert data["done_on_time"] == 1
    assert data["done_late"] == 1

    high_stats = next(
        p for p in data["by_priority"] if p["priority"] == Task.Priority.HIGH
    )
    assert high_stats["total"] == 2
    assert high_stats["done"] == 2
    assert high_stats["done_on_time"] == 1
    assert high_stats["done_late"] == 1


@pytest.mark.django_db
def test_monthly_report_kpi_csv(auth_client, creator, executor):
    """При ?format=csv должен возвращаться CSV-файл с одной строкой сводки."""

    now = timezone.now()
    month_str = now.strftime("%Y-%m")

    Task.objects.create(
        title="Done task",
        description="",
        priority=Task.Priority.MEDIUM,
        status=Task.Status.DONE,
        creator=creator,
        assignee=executor,
        due_at=now + timedelta(days=1),
    )

    url = reverse("reports-monthly") + f"?user={executor.id}&month={month_str}&format=csv"
    resp = auth_client.get(url)

    assert resp.status_code == 200, resp.content
    assert resp["Content-Type"].startswith("text/csv")

    content = resp.content.decode("utf-8")
    reader = csv.reader(io.StringIO(content))
    rows = list(reader)

    # заголовок
    assert rows[0] == ["user_id", "month", "total", "done", "done_on_time", "done_late"]
    # данные
    data_row = rows[1]
    assert int(data_row[0]) == executor.id
    assert data_row[1] == month_str
    assert int(data_row[2]) == 1  # total
    assert int(data_row[3]) == 1  # done
