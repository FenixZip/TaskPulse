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
    """
    Асинхронное уведомление при назначении задачи.
    Вызывается из сигналов tasks (post_save), когда задача только что
    получила исполнителя (assignee).
    """

    try:
        task = Task.objects.get(pk=task_id)
    except Task.DoesNotExist:
        return

    if not task.assignee_id:
        return

    notify_task_assigned(task)


@shared_task
def send_due_soon_reminders(window_minutes: int = 15) -> int:
    """
    Периодическая задача (раз в 10–15 минут):
    - ищет задачи, у которых дедлайн через ~24 часа
      в окне [24ч; 24ч + window_minutes],
    - у которых reminder_sent_at ещё не проставлен,
    - и есть исполнитель,
    - отправляет им Telegram-напоминание,
    - ставит reminder_sent_at, чтобы не слать повторно.
    Возвращает количество отправленных уведомлений.
    """

    now = timezone.now()
    start = now + timedelta(hours=24)
    end = start + timedelta(minutes=window_minutes)

    qs = Task.objects.filter(
        assignee__isnull=False,
        due_at__gte=start,
        due_at__lte=end,
        reminder_sent_at__isnull=True,
    )

    sent_count = 0

    for task in qs:
        notify_task_due_soon(task)
        task.reminder_sent_at = now
        task.save(update_fields=["reminder_sent_at"])
        sent_count += 1

    return sent_count
