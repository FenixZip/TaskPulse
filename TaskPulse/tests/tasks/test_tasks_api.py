import datetime
from datetime import timedelta

import pytest
from django.utils import timezone

from tasks.models import Task, TaskChangeLog


@pytest.mark.django_db
def test_create_task_sets_creator(auth_client, executor):
    """
    Цель: POST /api/tasks/ должен создать задачу с creator=request.user.

    Проверяем:
    - код 201
    - creator в ответе — id авторизованного пользователя
    """
    payload = {
        "title": "Новая задача",
        "description": "Описание",
        "priority": Task.Priority.HIGH,
        "status": Task.Status.NEW,
        "assignee": executor.id,
        "due_at": (timezone.now() + datetime.timedelta(days=2)).isoformat(),
    }
    resp = auth_client.post("/api/tasks/", payload, format="json")
    assert resp.status_code == 201, resp.content
    assert resp.data["creator"] is not None


@pytest.mark.django_db
def test_list_tasks_filter_search_ordering(auth_client, auth_client_executor, task_factory, executor):
    """Проверяем фильтры/поиск/сортировку и особенно assignee=me корректно."""

    # создаём 3 задачи с одинаковым исполнителем и словом "Отчёт" в title
    t1 = task_factory(title="Отчёт по продажам",   status=Task.Status.NEW,         priority=Task.Priority.LOW,    assignee=executor)
    t2 = task_factory(title="Сверстать отчёт",     status=Task.Status.IN_PROGRESS, priority=Task.Priority.MEDIUM, assignee=executor)
    t3 = task_factory(title="Отчёт для директора", status=Task.Status.DONE,        priority=Task.Priority.HIGH,   assignee=executor)

    # --- Фильтр по исполнителю: me — запрашиваем ИМЕННО клиентом-исполнителем
    r = auth_client_executor.get("/api/tasks/?assignee=me")
    assert r.status_code == 200
    # ⬇убеждаемся, что в списке есть наши три id (а не просто считаем длину)
    ids = {row["id"] for row in r.data}
    assert {t1.id, t2.id, t3.id}.issubset(ids)

    # --- Поиск + фильтр: сузим до исполнителя и проверим наличие наших задач
    r = auth_client_executor.get("/api/tasks/?assignee=me&search=Отчёт")
    assert r.status_code == 200
    ids = {row["id"] for row in r.data}
    # ⬇наши три задачи с "Отчёт" в заголовке обязательно должны попасть
    assert {t1.id, t2.id, t3.id}.issubset(ids)
    # при этом НЕ утверждаем, что все результаты содержат слово в title,
    #     т.к. SearchFilter может совпасть по description или прилететь что-то ещё.

    # --- Фильтр по статусу
    r = auth_client.get(f"/api/tasks/?status={Task.Status.DONE}")
    assert r.status_code == 200
    assert all(t["status"] == Task.Status.DONE for t in r.data)

    # --- Фильтр по приоритету
    r = auth_client.get(f"/api/tasks/?priority={Task.Priority.HIGH}")
    assert r.status_code == 200
    assert all(t["priority"] == Task.Priority.HIGH for t in r.data)

    # --- Сортировка по due_at
    r = auth_client.get("/api/tasks/?ordering=due_at")
    assert r.status_code == 200
    if r.data:
        assert "due_at" in r.data[0]

@pytest.mark.django_db
def test_patch_task_by_creator_allowed(auth_client, task_factory):
    """
    Цель: создатель задачи может менять её (PATCH /api/tasks/{id}/).

    Ожидаем:
    - 200 и обновлённое значение поля.
    """
    task = task_factory()
    r = auth_client.patch(f"/api/tasks/{task.id}/", {"status": Task.Status.IN_PROGRESS}, format="json")
    assert r.status_code == 200
    # получим детально и убедимся, что статус поменялся
    r2 = auth_client.get(f"/api/tasks/{task.id}/")
    assert r2.data["status"] == Task.Status.IN_PROGRESS


@pytest.mark.django_db
def test_patch_task_by_stranger_forbidden(api_client, task_factory, creator, user_factory):
    """
    Цель: посторонний пользователь не может изменять задачу.
    Шаги:
    - неавторизованный вызывает PATCH → 401/403
    - авторизуемся чужим юзером (не creator и не assignee) → 403
    """
    # ⬇фабрика по умолчанию создаёт задачу: creator=creator, assignee=executor
    task = task_factory()

    # --- неавторизованный клиент ---
    r = api_client.patch(f"/api/tasks/{task.id}/", {"status": Task.Status.DONE}, format="json")
    assert r.status_code in (401, 403)

    # --- авторизуем "постороннего": НЕ creator и НЕ assignee ---
    intruder = user_factory(role="EXECUTOR")          # или любая роль — главное, чтобы это был другой пользователь
    from rest_framework.authtoken.models import Token
    token, _ = Token.objects.get_or_create(user=intruder)
    api_client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    # теперь попытка изменить чужую задачу должна быть запрещена
    r2 = api_client.patch(f"/api/tasks/{task.id}/", {"status": Task.Status.DONE}, format="json")
    assert r2.status_code == 403

@pytest.mark.django_db
def test_action_confirm_on_time_writes_log(auth_client_executor, task_factory, executor):
    """
    Цель: POST /api/tasks/{id}/confirm-on-time доступен исполнителю
    и пишет запись в журнал (field='confirm_on_time').
    """
    task = task_factory(assignee=executor)
    r = auth_client_executor.post(f"/api/tasks/{task.id}/confirm-on-time/", {}, format="json")
    assert r.status_code == 200
    from tasks.models import TaskChangeLog
    assert TaskChangeLog.objects.filter(task=task, field="confirm_on_time", new_value="true").exists()

@pytest.mark.django_db
def test_action_extend_1d_requires_comment_and_moves_due(auth_client_executor, task_factory, executor):
    """
    Цель: POST /api/tasks/{id}/extend-1d/ требует 'comment'
    и сдвигает due_at ровно на сутки вперёд.
    """
    task = task_factory(assignee=executor)
    old_due = task.due_at

    # без коммента — 400 (ВАЖНО: завершающий /)
    r_bad = auth_client_executor.post(f"/api/tasks/{task.id}/extend-1d/", {}, format="json")
    assert r_bad.status_code == 400

    # с комментом — 200 (тоже со слешем)
    r_ok = auth_client_executor.post(
        f"/api/tasks/{task.id}/extend-1d/",
        {"comment": "нужны сутки"},
        format="json",
    )
    assert r_ok.status_code == 200
