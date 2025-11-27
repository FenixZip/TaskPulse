"""tasks/services/notifications.py"""
from integrations.models import TelegramProfile
from integrations.utils_telegram import send_telegram_message, build_task_link


def notify_task_assigned(task):
    """Отправляет уведомление исполнителю о том, что ему назначена новая задача."""

    if task.assignee_id is None:
        return

    try:
        profile = TelegramProfile.objects.get(user_id=task.assignee_id)
    except TelegramProfile.DoesNotExist:
        return

    link = build_task_link(task.id)
    text_lines = [
        "📌 Вам назначена новая задача",
        f"Название: {task.title}",
    ]
    if task.due_at:
        text_lines.append(f"Дедлайн: {task.due_at}")
    text_lines.append(f"Подробнее: {link}")

    text = "\n".join(text_lines)

    send_telegram_message(profile.chat_id, text)


def notify_task_due_soon(task):
    """Напоминание исполнителю, что дедлайн скоро (например, ~24 часа)."""

    if task.assignee_id is None:
        return

    try:
        profile = TelegramProfile.objects.get(user_id=task.assignee_id)
    except TelegramProfile.DoesNotExist:
        return

    link = build_task_link(task.id)
    text_lines = [
        "⏰ Напоминание о задаче",
        f"Название: {task.title}",
    ]
    if task.due_at:
        text_lines.append(f"Дедлайн: {task.due_at}")
    text_lines.append(f"Подробнее: {link}")

    text = "\n".join(text_lines)

    # при желании можно добавить inline-кнопки (см. пример внизу файла)
    send_telegram_message(profile.chat_id, text)
