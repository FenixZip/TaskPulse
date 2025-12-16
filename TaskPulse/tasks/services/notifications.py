"""tasks/services/notifications.py"""
from __future__ import annotations

from typing import Optional, Iterable

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


def _get_profiles_safe(user_ids: Iterable[int]) -> list[TelegramProfile]:
    """
    Возвращает список TelegramProfile для указанных пользователей.
    Удобно, когда нужно отправить нескольким сразу.
    """
    ids = [uid for uid in user_ids if uid]
    if not ids:
        return []
    return list(TelegramProfile.objects.filter(user_id__in=ids))


def notify_task_message(message: TaskMessage) -> None:
    """
    Уведомляет вторую сторону (создателя или исполнителя),
    что в чате по задаче пришло новое сообщение.

    При желании можно включить дублирование уведомления отправителю
    (см. комментарий внизу).
    """

    task = message.task
    sender = message.sender

    creator_id = task.creator_id
    assignee_id = task.assignee_id

    # --- определяем, кого уведомлять ---
    recipients: set[int] = set()

    # если написал создатель → уведомляем исполнителя
    if sender.id == creator_id and assignee_id:
        recipients.add(assignee_id)

    # если написал исполнитель → уведомляем создателя
    elif sender.id == assignee_id and creator_id:
        recipients.add(creator_id)

    # если сообщение от кого-то ещё (теоретически) — не шлём
    if not recipients:
        return

    # 👉 если хочешь, чтобы отправителю тоже приходила копия, раскомментируй:
    # recipients.add(sender.id)

    profiles = _get_profiles_safe(recipients)
    if not profiles:
        # никто из получателей не привязан к Telegram
        return

    link = build_task_link(task.id)

    full_name = (getattr(sender, "full_name", "") or "").strip()
    sender_name = full_name if full_name else sender.email

    # обрезаем сообщение, чтобы не слать огромный текст
    text_preview = (message.text or "").strip()
    if len(text_preview) > 300:
        text_preview = text_preview[:297] + "..."

    text_lines: list[str] = [
        "<b>Новое сообщение по задаче</b>",
        "",
        f"<b>{task.title}</b>",
        "",
        f"От: {sender_name}",
    ]

    if text_preview:
        text_lines.extend(["", text_preview])

    text_lines.extend(["", f"Открыть задачу: {link}"])

    text = "\n".join(text_lines)

    # рассылаем всем получателям, у кого есть TelegramProfile
    for profile in profiles:
        send_telegram_message(profile.chat_id, text, reply_markup=None)


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


def _get_profiles_safe(user_ids: Iterable[int]) -> list[TelegramProfile]:
    """
    Возвращает список TelegramProfile для указанных пользователей.
    Полезно, когда хотим разослать нескольким.
    """
    ids = [uid for uid in user_ids if uid]
    if not ids:
        return []
    return list(TelegramProfile.objects.filter(user_id__in=ids))


def notify_task_message(message: TaskMessage) -> None:
    """
    Уведомляет вторую сторону (создателя или исполнителя),
    что в чате по задаче пришло новое сообщение.

    При желании можно включить отправку копии самому отправителю
    (см. комментарий ниже).
    """

    task = message.task
    sender = message.sender

    creator_id = task.creator_id
    assignee_id = task.assignee_id

    # --- определяем получателей ---
    recipients: set[int] = set()

    # если написал создатель → уведомляем исполнителя
    if sender.id == creator_id and assignee_id:
        recipients.add(assignee_id)

    # если написал исполнитель → уведомляем создателя
    elif sender.id == assignee_id and creator_id:
        recipients.add(creator_id)

    # если сообщение не от создателя и не от исполнителя — никого не трогаем
    if not recipients:
        return

    # 👉 если хочешь, чтобы отправителю тоже приходила копия — раскомментируй:
    # recipients.add(sender.id)

    profiles = _get_profiles_safe(recipients)
    if not profiles:
        # ни у кого из получателей нет Telegram-профиля
        return

    link = build_task_link(task.id)

    sender_name = (
        getattr(sender, "full_name", "")
        or sender.get_full_name()
        or sender.email
    )

    # аккуратно обрезаем текст
    text_preview = (message.text or "").strip()
    if len(text_preview) > 300:
        text_preview = text_preview[:297] + "..."

    text_lines: list[str] = [
        "<b>Новое сообщение по задаче</b>",
        "",
        f"<b>{task.title}</b>",
        "",
        f"От: {sender_name}",
    ]

    if text_preview:
        text_lines.extend(["", text_preview])

    text_lines.extend(["", f"Открыть задачу: {link}"])

    text = "\n".join(text_lines)

    for profile in profiles:
        send_telegram_message(profile.chat_id, text, reply_markup=None)