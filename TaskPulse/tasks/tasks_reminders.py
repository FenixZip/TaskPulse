"""tasks/tasks_reminders.py"""
from __future__ import annotations

from datetime import timedelta

from celery import shared_task
from django.utils import timezone

from tasks.models import Task, TaskMessage
from tasks.services.notifications import (
    notify_task_assigned,
    notify_task_due_soon,
    notify_task_completed,
    notify_task_message,
)


@shared_task
def send_task_assigned_notification(task_id: int) -> None:
    """
    Асинхронно отправляет уведомление исполнителю
    о назначении новой задачи.
    """
    try:
        task = Task.objects.get(pk=task_id)
    except Task.DoesNotExist:
        return

    notify_task_assigned(task)


@shared_task
def send_task_completed_notification(task_id: int) -> None:
    """
    Асинхронно отправляет уведомление создателю,
    что задача выполнена.
    """
    try:
        task = Task.objects.get(pk=task_id)
    except Task.DoesNotExist:
        return

    notify_task_completed(task)


@shared_task
def send_new_task_message_notification(message_id: int) -> None:
    """
    Асинхронно уведомляет вторую сторону диалога
    о новом сообщении по задаче.
    """
    try:
        msg = TaskMessage.objects.select_related("task", "sender").get(
            pk=message_id
        )
    except TaskMessage.DoesNotExist:
        return

    notify_task_message(msg)


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
