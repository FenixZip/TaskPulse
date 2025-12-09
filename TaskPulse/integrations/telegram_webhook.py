"""TaskPulse/integrations/telegram_webhook.py"""

from __future__ import annotations

import json
import logging
import re
from typing import Any, Dict, Optional

from django.conf import settings
from django.http import HttpRequest, JsonResponse, HttpResponseForbidden
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from .models import TelegramProfile, TelegramLinkToken
from .notifications import send_telegram_message
from tasks.models import Task, TaskMessage  # <-- чат задачи

logger = logging.getLogger(__name__)

# /app/tasks/<id> или /tasks/<id> — под это заточен build_task_link
TASK_LINK_RE = re.compile(r"/tasks/(\d+)")


def _get_setting(name: str, default: Optional[Any] = None) -> Any:
    return getattr(settings, name, default)


def _extract_message(update: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if "message" in update:
        return update["message"]
    if "edited_message" in update:
        return update["edited_message"]
    return None


def _extract_task_id_from_text(text: str) -> Optional[int]:
    """
    Пытаемся вытащить ID задачи из текста уведомления бота.
    Ожидаем внутри ссылку вида .../tasks/<id>.
    """
    match = TASK_LINK_RE.search(text)
    if not match:
        return None
    try:
        return int(match.group(1))
    except ValueError:
        return None


def _handle_start_command(
    chat_id: int,
    text: str,
    from_user: Dict[str, Any],
) -> None:
    """
    Обработка /start и /start <token>
    """
    parts = text.split(maxsplit=1)

    # Просто /start — без токена
    if len(parts) == 1:
        send_telegram_message(
            chat_id,
            "Привет! Чтобы привязать Telegram к вашему аккаунту TaskPulse, "
            "перейдите по ссылке из личного кабинета и нажмите кнопку "
            "«Привязать Telegram».",
        )
        return

    # /start <token>
    start_token = parts[1]

    try:
        link = (
            TelegramLinkToken.objects
            .select_related("user")
            .get(token=start_token)
        )
    except TelegramLinkToken.DoesNotExist:
        send_telegram_message(
            chat_id,
            "⚠️ Ссылка для привязки недействительна или уже была использована.",
        )
        return

    user = link.user
    tg_user_id = from_user.get("id")

    profile, created = TelegramProfile.objects.update_or_create(
        user=user,
        defaults={
            "telegram_user_id": tg_user_id,
            "chat_id": chat_id,
            "last_activity_at": timezone.now(),
        },
    )

    # если есть флаг одноразовости — отмечаем
    if hasattr(link, "is_used") and not getattr(link, "is_used"):
        link.is_used = True
        link.save(update_fields=["is_used"])

    send_telegram_message(
        profile.chat_id,
        "✅ Telegram успешно привязан к вашему аккаунту TaskPulse.\n\n"
        "Теперь вы будете получать уведомления о задачах и дедлайнах здесь.",
    )


def _handle_help_command(chat_id: int) -> None:
    send_telegram_message(
        chat_id,
        "Я бот TaskPulse.\n\n"
        "Я отправляю уведомления о задачах, комментариях и дедлайнах.\n"
        "Чтобы ответить в чат задачи с сайта — просто ответьте (Reply) на "
        "моё сообщение по этой задаче.",
    )


def _handle_task_chat_message(
    message: Dict[str, Any],
    chat_id: int,
    tg_user_id: Optional[int],
) -> None:
    """
    Обычное сообщение (не команда).
    Если это reply на уведомление по задаче — создаём TaskMessage в БД.
    """

    if tg_user_id is None:
        return

    text = (message.get("text") or "").strip()
    if not text:
        return

    # Нас интересуют только reply — тогда мы знаем, к какой задаче это относится.
    reply_to = message.get("reply_to_message")
    if not reply_to:
        send_telegram_message(
            chat_id,
            "Чтобы отправить сообщение в чат задачи, ответьте (Reply) "
            "на моё уведомление по этой задаче.",
        )
        return

    original_text = (reply_to.get("text") or "").strip()
    task_id = _extract_task_id_from_text(original_text)
    if not task_id:
        send_telegram_message(
            chat_id,
            "Не удалось определить задачу для этого сообщения.\n\n"
            "Пожалуйста, ответьте (Reply) именно на уведомление о задаче, "
            "в котором есть ссылка «Открыть задачу».",
        )
        return

    # Находим профиль и пользователя
    try:
        profile = TelegramProfile.objects.select_related("user").get(
            telegram_user_id=tg_user_id
        )
    except TelegramProfile.DoesNotExist:
        send_telegram_message(
            chat_id,
            "Ваш Telegram ещё не привязан к аккаунту TaskPulse. "
            "Перейдите в личный кабинет и привяжите Telegram.",
        )
        return

    # Находим задачу
    try:
        task = Task.objects.get(pk=task_id)
    except Task.DoesNotExist:
        send_telegram_message(
            chat_id,
            "Задача, к которой относится это сообщение, не найдена.",
        )
        return

    # Создаём сообщение в чате задачи
    TaskMessage.objects.create(
        task=task,
        author=profile.user,
        text=text,
    )
    # Сигнал post_save TaskMessage сам отправит уведомление второй стороне
    # через send_new_task_message_notification.

    send_telegram_message(
        chat_id,
        "💬 Ваше сообщение отправлено в чат задачи на сайте.",
    )


@csrf_exempt
def telegram_webhook(request: HttpRequest, secret: str) -> JsonResponse:
    """
    Обработчик вебхука Telegram.

    URL: /api/integrations/telegram/webhook/<secret>/

    Поддерживаем:
    - /start <token>  — привязка Telegram к пользователю
    - /help           — помощь
    - обычные сообщения (reply на уведомление по задаче) -> TaskMessage
    """

    expected_secret = _get_setting("TELEGRAM_WEBHOOK_SECRET")
    if expected_secret and secret != expected_secret:
        logger.warning("Invalid Telegram webhook secret received")
        return HttpResponseForbidden("Invalid webhook secret")

    if request.method != "POST":
        return JsonResponse({"ok": True})

    try:
        body_raw = request.body.decode("utf-8")
        update = json.loads(body_raw)
    except Exception:  # noqa: BLE001
        logger.exception("Failed to decode Telegram update")
        return JsonResponse({"ok": True})

    try:
        message = _extract_message(update)
        if not message:
            return JsonResponse({"ok": True})

        chat = message.get("chat", {}) or {}
        chat_id = chat.get("id")
        if chat_id is None:
            return JsonResponse({"ok": True})

        text = (message.get("text") or "").strip()
        from_user = message.get("from", {}) or {}
        tg_user_id = from_user.get("id")

        # Команды
        if text.startswith("/start"):
            _handle_start_command(chat_id, text, from_user)
            return JsonResponse({"ok": True})

        if text == "/help":
            _handle_help_command(chat_id)
            return JsonResponse({"ok": True})

        # Обычное сообщение — пробуем обработать как сообщение в чат задачи
        _handle_task_chat_message(message, chat_id, tg_user_id)
        return JsonResponse({"ok": True})

    except Exception:  # noqa: BLE001
        logger.exception("Error while handling Telegram webhook")
        # Для Telegram важно всегда отвечать 200/ok, иначе он отключит webhook
        return JsonResponse({"ok": True})
