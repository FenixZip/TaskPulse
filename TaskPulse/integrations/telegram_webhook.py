"""TaskPulse/integrations/telegram_webhook.py"""

import json
import logging
from typing import Any, Dict, Optional

from django.conf import settings
from django.http import (
    HttpRequest,
    JsonResponse,
    HttpResponseForbidden,
)
from django.views.decorators.csrf import csrf_exempt

from .models import TelegramProfile, TelegramLinkToken
from .notifications import send_telegram_message

logger = logging.getLogger(__name__)


def _extract_message(payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Достаём message из update.
    Telegram может прислать message, edited_message, callback_query.message и т.п.
    Нас интересует обычное текстовое сообщение.
    """

    if "message" in payload:
        return payload["message"]
    if "edited_message" in payload:
        return payload["edited_message"]
    if "callback_query" in payload:
        cb = payload["callback_query"]
        if isinstance(cb, dict) and "message" in cb:
            return cb["message"]
    return None


@csrf_exempt
def telegram_webhook(request: HttpRequest, secret: str):
    """
    Webhook для Telegram.

    URL: /api/integrations/telegram/webhook/<secret>/

    1. Проверяем secret.
    2. Принимаем только POST.
    3. Разбираем JSON-апдейт.
    4. Обрабатываем команду /start <token>:
       - находим TelegramLinkToken по token;
       - помечаем его использованным;
       - создаём/обновляем TelegramProfile;
       - отправляем подтверждение пользователю.
    5. /help — отправляем подсказку.
    6. Всё остальное — просто {"ok": true}, без 500.
    """

    # 1. секрет
    if secret != settings.TELEGRAM_WEBHOOK_SECRET:
        return HttpResponseForbidden("Invalid secret")

    # 2. принимаем только POST от Telegram
    if request.method != "POST":
        return JsonResponse({"ok": True})

    try:
        # 3. читаем JSON
        try:
            payload = json.loads(request.body.decode("utf-8"))
        except json.JSONDecodeError:
            logger.warning("Telegram webhook: invalid JSON")
            return JsonResponse({"ok": True})

        message = _extract_message(payload)
        if not message:
            # ничего интересного — просто подтверждаем
            return JsonResponse({"ok": True})

        chat = message.get("chat") or {}
        chat_id = chat.get("id")
        text = (message.get("text") or "").strip()

        # если нет chat_id — это какая-то странная сущность, пропускаем
        if chat_id is None:
            return JsonResponse({"ok": True})

        # 4. /start с токеном
        if text.startswith("/start"):
            parts = text.split(maxsplit=1)
            if len(parts) == 1:
                # /start без параметра — просто приветствие
                send_telegram_message(
                    chat_id,
                    "👋 Это бот Pulse-zone. Для привязки аккаунта зайдите на сайт и "
                    "нажмите кнопку «Привязать Telegram».",
                )
                return JsonResponse({"ok": True})

            start_token = parts[1]

            try:
                link = TelegramLinkToken.objects.select_related("user").get(
                    token=start_token,
                    is_used=False,
                )
            except TelegramLinkToken.DoesNotExist:
                send_telegram_message(
                    chat_id,
                    "⚠️ Ссылка для привязки недействительна или уже использована.",
                )
                return JsonResponse({"ok": True})

            # помечаем токен использованным
            link.is_used = True
            link.save(update_fields=["is_used"])

            user = link.user

            # создаём/обновляем TelegramProfile
            profile, _ = TelegramProfile.objects.get_or_create(user=user)
            # предполагаем, что в модели есть эти поля
            profile.telegram_user_id = chat_id
            profile.chat_id = chat_id
            profile.is_confirmed = True
            profile.connect_token = None
            profile.save(
                update_fields=[
                    "telegram_user_id",
                    "chat_id",
                    "is_confirmed",
                    "connect_token",
                ]
            )

            send_telegram_message(
                chat_id,
                f"✅ Telegram успешно привязан к аккаунту {user.email}.",
            )
            return JsonResponse({"ok": True})

        # 5. /help
        if text == "/help":
            send_telegram_message(
                chat_id,
                "Я бот Pulse-zone. Я присылаю уведомления о задачах и напоминаниях 🚀",
            )
            return JsonResponse({"ok": True})

        # 6. всё остальное игнорируем
        return JsonResponse({"ok": True})

    except Exception:  # pylint: disable=broad-except
        # Ловим любые ошибки, чтобы НИКОГДА не возвращать 500 Telegram-у.
        logger.exception("Error while handling Telegram webhook")
        return JsonResponse({"ok": True})
