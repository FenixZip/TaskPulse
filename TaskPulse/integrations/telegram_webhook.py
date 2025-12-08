"""TaskPulse/integrations/telegram_webhook.py"""

import json
import logging
from typing import Any, Dict, Optional

from django.conf import settings
from django.http import HttpRequest, JsonResponse, HttpResponseForbidden
from django.views.decorators.csrf import csrf_exempt

from .models import TelegramProfile, TelegramLinkToken
from .notifications import send_telegram_message

logger = logging.getLogger(__name__)


def _extract_message(payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Достаём message из update (message / edited_message / callback_query.message)."""
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

    Обрабатываем:

      /start <token>  – привязка по токену (из deep-link)
      /start          – привязка по последнему созданному токену
    """

    # секрет
    if secret != settings.TELEGRAM_WEBHOOK_SECRET:
        return HttpResponseForbidden("Invalid secret")

    # Telegram может дёргать GET/HEAD – просто отвечаем ok
    if request.method != "POST":
        return JsonResponse({"ok": True})

    try:
        try:
            payload = json.loads(request.body.decode("utf-8"))
        except json.JSONDecodeError:
            logger.warning("Telegram webhook: invalid JSON")
            return JsonResponse({"ok": True})

        message = _extract_message(payload)
        if not message:
            return JsonResponse({"ok": True})

        chat = message.get("chat") or {}
        chat_id = chat.get("id")
        text = (message.get("text") or "").strip()

        if chat_id is None:
            return JsonResponse({"ok": True})

        # ---------- /start ----------
        if text.startswith("/start"):
            parts = text.split(maxsplit=1)
            start_token: Optional[str] = None

            if len(parts) == 2 and parts[1]:
                # /start <token> из deep-link
                start_token = parts[1]
            else:
                # /start без параметра — берём последний созданный token
                try:
                    last_link = (
                        TelegramLinkToken.objects
                        .order_by("-created_at")
                        .first()
                    )
                    if last_link:
                        start_token = str(last_link.token)
                except Exception:  # noqa: BLE001
                    logger.exception("Failed to get last TelegramLinkToken")

            if not start_token:
                send_telegram_message(
                    chat_id,
                    "👋 Это бот Pulse-zone. Для привязки аккаунта зайдите на сайт "
                    "и нажмите кнопку «Привязать Telegram».",
                )
                return JsonResponse({"ok": True})

            # ищем TelegramLinkToken по токену
            try:
                link = (
                    TelegramLinkToken.objects
                    .select_related("user")
                    .get(token=start_token)
                )
            except TelegramLinkToken.DoesNotExist:
                send_telegram_message(
                    chat_id,
                    "⚠️ Ссылка для привязки недействительна или уже удалена.",
                )
                return JsonResponse({"ok": True})

            user = link.user

            # создаём/обновляем профиль
            profile, _ = TelegramProfile.objects.get_or_create(user=user)
            profile.telegram_user_id = chat_id
            profile.chat_id = chat_id
            profile.save(update_fields=["telegram_user_id", "chat_id"])

            # помечаем токен использованным, если есть поле
            if hasattr(link, "is_used"):
                link.is_used = True
                link.save(update_fields=["is_used"])

            send_telegram_message(
                chat_id,
                f"✅ Telegram успешно привязан к аккаунту {user.email}.",
            )
            return JsonResponse({"ok": True})

        # ---------- /help ----------
        if text == "/help":
            send_telegram_message(
                chat_id,
                "Я бот Pulse-zone. Я присылаю уведомления о задачах и напоминаниях 🚀",
            )
            return JsonResponse({"ok": True})

        # остальные сообщения игнорируем
        return JsonResponse({"ok": True})

    except Exception:  # noqa: BLE001
        logger.exception("Error while handling Telegram webhook")
        # ВАЖНО: никогда не даём 500 Telegram'у
        return JsonResponse({"ok": True})
