"""tests/tasks/test_task_actionlog.py
Тесты журнала действий TaskActionLog.
"""

import pytest
from django.utils import timezone
from tasks.models import Task, TaskActionLog


@pytest.mark.django_db
def test_log_action_creates_record(task_factory, executor):
    """
    Цель: убедиться, что TaskActionLog.log_action создаёт запись в БД
    и корректно заполняет основные поля (task, user, action, comment).
    """

    task: Task = task_factory(assignee=executor)
    log_entry: TaskActionLog = TaskActionLog.log_action(
        task=task,
        user=executor,
        action=TaskActionLog.Action.CONFIRM_ON_TIME,
        comment="Подтверждение через тест.",
    )

    assert TaskActionLog.objects.count() == 1
    assert log_entry.task == task
    assert log_entry.user == executor
    assert log_entry.action == TaskActionLog.Action.CONFIRM_ON_TIME
    assert log_entry.comment == "Подтверждение через тест."


@pytest.mark.django_db
def test_log_action_saves_due_dates(task_factory, executor):
    """
    Цель: проверить, что TaskActionLog.log_action корректно сохраняет
    старый и новый дедлайны (old_due_at / new_due_at).
    """

    initial_due_at = timezone.now() + timezone.timedelta(hours=2)
    task: Task = task_factory(assignee=executor, due_at=initial_due_at)

    # ⬇️ считаем новый дедлайн: +1 день к исходному
    new_due_at = initial_due_at + timezone.timedelta(days=1)

    # ⬇️ логируем действие продления дедлайна на 1 день
    log_entry: TaskActionLog = TaskActionLog.log_action(
        task=task,  # задача
        user=executor,  # исполнитель
        action=TaskActionLog.Action.EXTEND_DUE_1D,  # код действия
        comment="Продление на сутки (тест).",  # комментарий
        old_due_at=initial_due_at,  # старый дедлайн
        new_due_at=new_due_at,  # новый дедлайн
    )

    # ⬇️ проверяем, что в базе действительно одна запись
    assert TaskActionLog.objects.count() == 1

    # ⬇️ убеждаемся, что старый дедлайн записан корректно (с точностью до секунды)
    assert log_entry.old_due_at == initial_due_at

    # ⬇️ проверяем, что новый дедлайн записан корректно
    assert log_entry.new_due_at == new_due_at

    # ⬇️ дополнительно проверим, что тип действия — именно EXTEND_DUE_1D
    assert log_entry.action == TaskActionLog.Action.EXTEND_DUE_1D


@pytest.mark.django_db
def test_log_action_can_be_system_action(task_factory):
    """
    Цель: убедиться, что TaskActionLog поддерживает действия без пользователя
    (system / автоматические события), то есть user может быть None.

    Шаги:
    1) Создаём задачу.
    2) Вызываем log_action с user=None.
    3) Проверяем, что запись создалась и поле user действительно NULL.
    """

    # ⬇️ создаём задачу; исполнителя специально не задаём — он нам не важен
    task: Task = task_factory()

    # ⬇️ логируем «системное» действие без пользователя (user=None)
    log_entry: TaskActionLog = TaskActionLog.log_action(
        task=task,  # задача
        user=None,  # нет конкретного пользователя
        action=TaskActionLog.Action.OTHER,  # произвольное действие
        comment="Системное действие в тесте.",  # поясняющий комментарий
    )

    # ⬇️ запись должна существовать в БД
    assert TaskActionLog.objects.filter(id=log_entry.id).exists()

    # ⬇️ поле user должно быть действительно NULL (None в Python)
    assert log_entry.user is None
