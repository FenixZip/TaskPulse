"""tasks/tasks_reminders.py"""
from datetime import timedelta

from celery import shared_task
from django.utils import timezone

from tasks.models import Task
from tasks.services.notifications import (
    notify_task_assigned,
    notify_task_due_soon,
)


@shared_task
def send_task_assigned_notification(task_id: int) -> None:
    """Ищет задачу по id и вызывает notify_task_assigned."""

    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        return
    notify_task_assigned(task)

@shared_task
def send_due_soon_reminders() -> int:
    """
    Ищет задачи, у которых до дедлайна осталось ~24 часа,
    и шлёт напоминание, если ещё не отправляли.
    """

    now = timezone.now()
    start = now + timedelta(hours=23)   # окно от 23 до 25 часов
    end = now + timedelta(hours=25)

    qs = Task.objects.filter(
        due_at__gte=start,
        due_at__lte=end,
        reminder_sent_at__isnull=True,
        status__in=[Task.Status.NEW, Task.Status.IN_PROGRESS],
    )

    sent_count = 0
    for task in qs:
        notify_task_due_soon(task)
        task.reminder_sent_at = now
        task.save(update_fields=["reminder_sent_at"])
        sent_count += 1

    return sent_count