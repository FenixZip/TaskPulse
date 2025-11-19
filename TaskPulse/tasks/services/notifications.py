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

    text = (
        f"<b>{task.title}</b>\n\n"
        f"Открыть задачу: {link}"
    )

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
