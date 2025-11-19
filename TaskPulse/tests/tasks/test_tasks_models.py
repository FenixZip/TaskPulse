"""tasks/tests/test_models.py"""

from datetime import timedelta

import pytest
from django.utils import timezone
from tasks.models import Task, TaskChangeLog


@pytest.mark.django_db
def test_task_mark_overdue_sets_status_and_logs(task_factory):
    """Цель: проверить бизнес-метод Task.mark_overdue()"""

    task = task_factory(
        due_at=timezone.now() - timedelta(hours=1), status=Task.Status.NEW
    )
    task.mark_overdue()
    assert task.status == Task.Status.OVERDUE
    log = TaskChangeLog.objects.filter(task=task, field="status").first()
    assert log is not None
    assert log.old_value == Task.Status.NEW
    assert log.new_value == Task.Status.OVERDUE


@pytest.mark.django_db
def test_task_save_logs_priority_status_due_changes(task_factory):
    """Убеждаемся, что переопределённый save() логирует изменения"""

    task = task_factory()

    # меняем приоритет
    old_p = task.priority
    task.priority = Task.Priority.HIGH
    task.save()
    assert TaskChangeLog.objects.filter(
        task=task, field="priority", old_value=old_p, new_value=Task.Priority.HIGH
    ).exists()
    old_s = task.status
    task.status = Task.Status.IN_PROGRESS
    task.save()
    assert TaskChangeLog.objects.filter(
        task=task, field="status", old_value=old_s, new_value=Task.Status.IN_PROGRESS
    ).exists()
    # меняем срок
    old_due = task.due_at
    task.due_at = timezone.now() + timedelta(days=3)
    task.save()
    rec = TaskChangeLog.objects.filter(task=task, field="due_at").latest("changed_at")
    assert rec.old_value.startswith(old_due.date().isoformat())
    assert rec.new_value.startswith(task.due_at.date().isoformat())
