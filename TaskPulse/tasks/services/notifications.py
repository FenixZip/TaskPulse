"""tasks/services/notifications.py"""
from __future__ import annotations

from typing import Optional

from integrations.models import TelegramProfile
from integrations.utils_telegram import send_telegram_message, build_task_link
from tasks.models import Task, TaskMessage


def _get_profile_safe(user_id: int) -> Optional[TelegramProfile]:
    """
    Возвращает TelegramProfile пользователя или None,
    если профиль не найден.
    """
    if not user_id:
        return None

    try:
        return TelegramProfile.objects.get(user_id=user_id)
    except TelegramProfile.DoesNotExist:
        return None


# === 1. Назначение задачи исполнителю ===


def notify_task_assigned(task: Task) -> None:
    """
    Отправляет уведомление исполнителю о том,
    что ему назначена новая задача.
    """

    if task.assignee_id is None:
        return

    profile = _get_profile_safe(task.assignee_id)
    if profile is None:
        return

    link = build_task_link(task.id)

    text_lines: list[str] = [
        "🆕 <b>Новая задача</b>",
        "",
        f"<b>{task.title}</b>",
    ]
    if task.description:
        text_lines.append("")
        text_lines.append(task.description)

    text_lines.extend(
        [
            "",
            f"⏰ Дедлайн: {task.due_at.strftime('%d.%m.%Y %H:%M') if task.due_at else 'не указан'}",
            "",
            f"Открыть задачу: {link}",
        ]
    )

    text = "\n".join(text_lines)

    reply_markup = {
        "inline_keyboard": [
            [
                {
                    "text": "⏰ Продлить на сутки",
                    "callback_data": f"extend_1d:{task.id}",
                },
                {
                    "text": "✅ Сделаю вовремя",
                    "callback_data": f"confirm_on_time:{task.id}",
                },
            ]
        ]
    }

    send_telegram_message(profile.chat_id, text, reply_markup=reply_markup)


# === 2. Напоминание за 24 часа до дедлайна ===


def notify_task_due_soon(task: Task) -> None:
    """
    Отправляет напоминание за ~24 часа до дедлайна.
    """

    if task.assignee_id is None:
        return

    profile = _get_profile_safe(task.assignee_id)
    if profile is None:
        return

    link = build_task_link(task.id)

    text_lines: list[str] = [
        "⏰ <b>Напоминание о задаче</b>",
        "",
        f"<b>{task.title}</b>",
    ]
    text_lines.extend(
        [
            "",
            "Дедлайн наступит примерно через 24 часа.",
            "Проверьте, всё ли идёт по плану:",
            "",
            f"Открыть задачу: {link}",
        ]
    )

    text = "\n".join(text_lines)

    reply_markup = {
        "inline_keyboard": [
            [
                {
                    "text": "⏰ Продлить на сутки",
                    "callback_data": f"extend_1d:{task.id}",
                },
                {
                    "text": "✅ Сделаю вовремя",
                    "callback_data": f"confirm_on_time:{task.id}",
                },
            ]
        ]
    }

    send_telegram_message(profile.chat_id, text, reply_markup=reply_markup)


# === 3. Задача выполнена (уведомление создателю) ===


def notify_task_completed(task: Task) -> None:
    """
    Уведомляет создателя, что задача выполнена.
    """

    if task.creator_id is None:
        return

    profile = _get_profile_safe(task.creator_id)
    if profile is None:
        return

    link = build_task_link(task.id)

    assignee_name = ""
    if task.assignee_id:
        assignee = task.assignee  # type: ignore[assignment]
        assignee_name = (
                getattr(assignee, "full_name", "")
                or assignee.get_full_name()
                or assignee.email
        )

    text_lines: list[str] = [
        "✅ <b>Задача выполнена</b>",
        "",
        f"<b>{task.title}</b>",
    ]
    if task.description:
        text_lines.append("")
        text_lines.append(task.description)

    if assignee_name:
        text_lines.extend(["", f"👤 Исполнитель: {assignee_name}"])

    text_lines.extend(["", f"Открыть задачу: {link}"])

    text = "\n".join(text_lines)

    send_telegram_message(profile.chat_id, text, reply_markup=None)


# === 4. Новое сообщение в чате по задаче ===


def notify_task_message(message: TaskMessage) -> None:
    """
    Уведомляет вторую сторону (создателя или исполнителя),
    что в чате по задаче пришло новое сообщение.
    """

    task = message.task
    sender = message.sender

    # если написал создатель → уведомляем исполнителя
    # если написал исполнитель → уведомляем создателя
    recipient_id: Optional[int] = None
    if sender.id == task.creator_id and task.assignee_id:
        recipient_id = task.assignee_id
    elif sender.id == task.assignee_id and task.creator_id:
        recipient_id = task.creator_id

    if not recipient_id:
        return

    profile = _get_profile_safe(recipient_id)
    if profile is None:
        return

    link = build_task_link(task.id)

    sender_name = (
            getattr(sender, "full_name", "")
            or sender.get_full_name()
            or sender.email
    )

    # обрезаем текст сообщения, чтобы не слать полотно
    text_preview = (message.text or "").strip()
    if len(text_preview) > 300:
        text_preview = text_preview[:297] + "..."

    text_lines: list[str] = [
        "📩 <b>Новое сообщение по задаче</b>",
        "",
        f"<b>{task.title}</b>",
        "",
        f"От: {sender_name}",
    ]

    if text_preview:
        text_lines.extend(["", text_preview])

    text_lines.extend(["", f"Открыть задачу: {link}"])

    text = "\n".join(text_lines)

    send_telegram_message(profile.chat_id, text, reply_markup=None)
