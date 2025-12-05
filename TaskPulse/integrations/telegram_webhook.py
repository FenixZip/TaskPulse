"""TaskPulse/integrations/telegram_webhook.py"""
from django.conf import settings
from django.http import HttpRequest, JsonResponse, HttpResponseForbidden
from django.views.decorators.csrf import csrf_exempt
import json

from .models import TelegramProfile
from .notifications import send_telegram_message


@csrf_exempt
def telegram_webhook(request: HttpRequest, secret: str):
    # проверяем секрет в URL
    if secret != settings.TELEGRAM_WEBHOOK_SECRET:
        return HttpResponseForbidden("Invalid secret")

    if request.method != "POST":
        return JsonResponse({"ok": True})

    try:
        payload = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"ok": False, "error": "invalid json"})

    message = payload.get("message") or payload.get("edited_message")
    if not message:
        # например, callback_query и т.п. — пока игнорируем
        return JsonResponse({"ok": True})

    chat = message.get("chat") or {}
    text = message.get("text") or ""
    chat_id = chat.get("id")
    from_user = message.get("from") or {}
    telegram_user_id = from_user.get("id")

    if not (chat_id and telegram_user_id):
        return JsonResponse({"ok": True})

    # /start <token>
    if text.startswith("/start"):
        parts = text.split(maxsplit=1)
        token = parts[1] if len(parts) > 1 else None

        if not token:
            send_telegram_message(chat_id, "Привет! Чтобы привязать Telegram, зайди в личный кабинет Pulse-zone.")
            return JsonResponse({"ok": True})

        try:
            profile = TelegramProfile.objects.select_related("user").get(connect_token=token)
        except TelegramProfile.DoesNotExist:
            send_telegram_message(chat_id, "Ссылка для подключения недействительна. Попробуй заново из личного кабинета.")
            return JsonResponse({"ok": True})

        profile.telegram_user_id = telegram_user_id
        profile.chat_id = chat_id
        profile.is_confirmed = True
        profile.connect_token = None
        profile.save(update_fields=["telegram_user_id", "chat_id", "is_confirmed", "connect_token"])

        send_telegram_message(chat_id, f"✅ Telegram успешно привязан к аккаунту {profile.user.email}.")
        return JsonResponse({"ok": True})

    # остальные сообщения можно пока игнорировать или сделать help
    if text == "/help":
        send_telegram_message(chat_id, "Я бот Pulse-zone. Задачи и напоминания приходят автоматически 🚀")
    return JsonResponse({"ok": True})
