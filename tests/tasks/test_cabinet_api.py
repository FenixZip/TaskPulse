"""tests/tasks/test_cabinet_api.py"""
import pytest
from datetime import timedelta

from django.urls import reverse
from django.utils import timezone

from tasks.models import Task
from accounts.models import User


@pytest.mark.django_db
def test_creator_tasks_requires_creator_role(api_client, auth_client_executor):
    """Исполнитель (EXECUTOR) не должен иметь доступа к списку задач Создателя."""

    url = reverse("creator-tasks")

    # неавторизованный — 401/403 (в зависимости от настроек)
    resp_anon = api_client.get(url)
    assert resp_anon.status_code in (401, 403)

    # авторизованный EXECUTOR — строго 403
    resp_exec = auth_client_executor.get(url)
    assert resp_exec.status_code == 403


@pytest.mark.django_db
def test_creator_tasks_returns_only_own_created_tasks(
        auth_client, creator, executor, user_factory, task_factory
):
    """Создатель видит только свои задачи, фильтрация по creator."""

    # задача, созданная этим creator
    own_task = task_factory(creator=creator, assignee=executor)

    # задача другого создателя
    other_creator = user_factory(role=User.Role.CREATOR)
    task_factory(creator=other_creator, assignee=executor)

    url = reverse("creator-tasks")
    resp = auth_client.get(url)
    assert resp.status_code == 200, resp.content

    data = resp.json()
    # ListAPIView без пагинации — это просто список
    ids = {item["id"] for item in data}
    assert own_task.id in ids
    assert len(ids) == 1


@pytest.mark.django_db
def test_creator_tasks_filters_by_status_and_assignee(
        auth_client, creator, executor, user_factory, task_factory
):
    """Фильтры status и assignee в кабинете Создателя работают."""

    other_executor = user_factory(role=User.Role.EXECUTOR)

    task_ok = task_factory(
        creator=creator,
        assignee=executor,
        status=Task.Status.NEW,
    )
    task_factory(
        creator=creator,
        assignee=other_executor,
        status=Task.Status.DONE,
    )

    base_url = reverse("creator-tasks")
    url = f"{base_url}?status={Task.Status.NEW}&assignee={executor.id}"

    resp = auth_client.get(url)
    assert resp.status_code == 200, resp.content

    data = resp.json()
    ids = {item["id"] for item in data}
    assert ids == {task_ok.id}


@pytest.mark.django_db
def test_executor_tasks_returns_only_assigned(
        auth_client_executor, creator, executor, user_factory, task_factory
):
    """Кабинет Исполнителя: он видит только задачи, где он assignee."""

    own_task = task_factory(creator=creator, assignee=executor)
    other_exec = user_factory(role=User.Role.EXECUTOR)
    task_factory(creator=creator, assignee=other_exec)

    url = reverse("executor-tasks")
    resp = auth_client_executor.get(url)
    assert resp.status_code == 200, resp.content

    data = resp.json()
    ids = {item["id"] for item in data}
    assert ids == {own_task.id}


@pytest.mark.django_db
def test_executor_task_detail_only_own(
        auth_client_executor, creator, executor, user_factory, task_factory
):
    """
    Детальная карточка задачи для Исполнителя:
    - свою задачу видит (200),
    - чужую не видит (404).
    """

    own_task = task_factory(creator=creator, assignee=executor)
    other_exec = user_factory(role=User.Role.EXECUTOR)
    foreign_task = task_factory(creator=creator, assignee=other_exec)

    # своя задача
    url_own = reverse("executor-task-detail", kwargs={"pk": own_task.id})
    resp_own = auth_client_executor.get(url_own)
    assert resp_own.status_code == 200, resp_own.content
    data_own = resp_own.json()
    assert data_own["id"] == own_task.id
    # проверяем, что прилетели вложения/история (пустые списки, но ключи есть)
    assert "attachments" in data_own
    assert "actions" in data_own

    # чужая задача — должна быть NotFound (404), чтобы не палить ID
    url_foreign = reverse("executor-task-detail", kwargs={"pk": foreign_task.id})
    resp_foreign = auth_client_executor.get(url_foreign)
    assert resp_foreign.status_code == 404


@pytest.mark.django_db
def test_creator_stats_by_assignee_requires_creator(
        api_client, auth_client_executor
):
    """/me/creator/stats-by-assignee/ доступен только CREATOR."""

    url = reverse("creator-stats-by-assignee")

    # аноним — 401/403
    resp_anon = api_client.get(url)
    assert resp_anon.status_code in (401, 403)

    # EXECUTOR — 403
    resp_exec = auth_client_executor.get(url)
    assert resp_exec.status_code == 403


@pytest.mark.django_db
def test_creator_stats_by_assignee_basic_kpi(
        auth_client, creator, executor, task_factory
):
    """
    Простая проверка KPI в сводке по сотрудникам:
    - total по исполнителю;
    - done / done_on_time / done_late считаются корректно;
    - фильтр по month работает.
    """

    now = timezone.now()
    month_str = now.strftime("%Y-%m")

    # задача, выполненная В СРОК (updated_at <= due_at)
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

    # задача, выполненная ПОСЛЕ срока (updated_at > due_at)
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

    # задача с дедлайном в другом месяце — не должна войти
    Task.objects.create(
        title="Other month",
        description="",
        priority=Task.Priority.HIGH,
        status=Task.Status.DONE,
        creator=creator,
        assignee=executor,
        due_at=now + timedelta(days=40),
    )

    url = reverse("creator-stats-by-assignee") + f"?month={month_str}"
    resp = auth_client.get(url)
    assert resp.status_code == 200, resp.content

    data = resp.json()
    # ожидаем один элемент в results
    results = data.get("results") or []
    assert len(results) == 1

    row = results[0]
    assert row["assignee_id"] == executor.id
    assert row["total"] == 2
    assert row["done"] == 2
    assert row["done_on_time"] == 1
    assert row["done_late"] == 1
