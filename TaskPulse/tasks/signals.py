"""tasks/signals.py"""
from __future__ import annotations

from django.db.models.signals import post_save
from django.dispatch import receiver

from tasks.models import Task
from tasks.tasks_reminders import send_task_assigned_notification


@receiver(post_save, sender=Task)
def task_assignee_notification(sender, instance: Task, created: bool, **kwargs) -> None:
    """
    Отправляет асинхронное уведомление, когда задача назначена исполнителю.
    Логика упрощённая:
    - если задача только что создана И есть assignee → шлём уведомление;
    """

    if created and instance.assignee_id:
        send_task_assigned_notification.delay(instance.pk)
