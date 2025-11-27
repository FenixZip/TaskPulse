"""tests/tasks/test_pagination.py"""
import pytest
from django.urls import reverse


@pytest.mark.django_db
def test_tasks_list_returns_all_tasks(auth_client, task_factory, creator, executor):
    """
    Цель: убедиться, что список задач отдаётся корректно и содержит все созданные задачи.
    Сейчас глобальная пагинация DRF не включена, поэтому эндпоинт /api/tasks/
    возвращает простой список объектов задач, а не обёртку вида {count, results, ...}.
    """

    # создаём 30 задач
    for _ in range(30):
        task_factory(creator=creator, assignee=executor)

    url = reverse("task-list")
    resp = auth_client.get(url)
    assert resp.status_code == 200, resp.content

    data = resp.json()

    # текущий формат ответа — список
    assert isinstance(data, list)

    # в списке должны быть все 30 задач
    assert len(data) == 30

    # проверим, что у элемента есть ключевые поля
    first = data[0]
    assert "id" in first
    assert "title" in first
    assert "priority" in first
    assert "status" in first
