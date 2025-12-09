"""tasks/signals.py"""
from __future__ import annotations

from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver

from tasks.models import Task, TaskMessage
from tasks.services.notifications import (
    notify_task_assigned,
    notify_task_completed,
    notify_task_message,
)


# === Task: создание и смена статуса ===


@receiver(pre_save, sender=Task)
def store_old_status(sender, instance: Task, **kwargs) -> None:  # noqa: ANN001
    """
    Перед сохранением задачи запоминаем старый статус,
    чтобы в post_save понять, был ли переход в DONE.
    """
    if not instance.pk:
        instance._old_status = None  # type: ignore[attr-defined]
        return

    try:
        old = sender.objects.get(pk=instance.pk)
    except sender.DoesNotExist:  # type: ignore[attr-defined]
        instance._old_status = None  # type: ignore[attr-defined]
    else:
        instance._old_status = old.status  # type: ignore[attr-defined]


@receiver(post_save, sender=Task)
def task_post_save(sender, instance: Task, created: bool, **kwargs) -> None:  # noqa: ANN001
    """
    - При создании задачи с исполнителем → уведомляем исполнителя.
    - При смене статуса на DONE → уведомляем создателя.
    Все уведомления отправляются синхронно, без Celery.
    """

    # Новая задача → уведомляем исполнителя
    if created and instance.assignee_id:
        notify_task_assigned(instance)
        return

    # Не новое — проверяем смену статуса
    if not created:
        old_status = getattr(instance, "_old_status", None)
        new_status = instance.status
        if old_status != new_status and new_status == Task.Status.DONE:
            notify_task_completed(instance)


# === TaskMessage: новое сообщение в чате ===


@receiver(post_save, sender=TaskMessage)
def task_message_post_save(
    sender, instance: TaskMessage, created: bool, **kwargs  # noqa: ANN001
) -> None:
    """
    При создании нового сообщения в чате по задаче
    отправляем уведомление второй стороне (создателю или исполнителю).
    """
    if not created:
        return

    notify_task_message(instance)
