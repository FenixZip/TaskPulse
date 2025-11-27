"""tasks/signals.py"""
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Task
from .tasks_reminders import send_task_assigned_notification


@receiver(post_save, sender=Task)
def task_assigned_handler(sender, instance: Task, created: bool, **kwargs):
    """
    Вызывается при создании/сохранении задачи.
    Если есть assignee — отправляем Celery-таску на уведомление.
    """

    # если исполнителя нет — нечего уведомлять
    if not instance.assignee_id:
        return

    # если задача только что создана → точно новое назначение
    if created:
        send_task_assigned_notification.delay(instance.id)
        return

    # тут можно усложнить и отслеживать смену assignee
    # но для начала можно просто уведомлять при любом сохранении,
    # если у задачи есть исполнитель
    send_task_assigned_notification.delay(instance.id)
