"""TaskPulse/integrations/telegram_api.py"""
import secrets

from django.conf import settings
from django.http import (
    HttpRequest,
    HttpResponseBadRequest,
    HttpResponseForbidden,
    HttpResponseRedirect,
)
from rest_framework.authtoken.models import Token

from .models import TelegramProfile


def telegram_connect_start(request: HttpRequest):
    """
    GET /api/integrations/telegram/connect/?token=<auth_token>

    1. По DRF-токену находим пользователя.
    2. Генерируем одноразовый connect_token для Telegram.
    3. Сохраняем его в TelegramProfile.
    4. Редиректим в https://t.me/<TELEGRAM_BOT_NAME>?start=<connect_token>.
    """

    raw_token = request.GET.get("token")
    if not raw_token:
        return HttpResponseBadRequest("Missing token")

    try:
        token_obj = Token.objects.get(key=raw_token)
    except Token.DoesNotExist:
        return HttpResponseForbidden("Invalid token")

    user = token_obj.user

    # генерим/обновляем одноразовый токен для привязки телеги
    connect_token = secrets.token_urlsafe(16)

    profile, _ = TelegramProfile.objects.get_or_create(
        user=user,
        defaults={"telegram_user_id": 0, "chat_id": 0},
    )
    profile.connect_token = connect_token
    profile.is_confirmed = False
    profile.save(update_fields=["connect_token", "is_confirmed"])

    bot_name = getattr(settings, "TELEGRAM_BOT_NAME", "").strip()
    if not bot_name:
        return HttpResponseBadRequest("TELEGRAM_BOT_NAME is not configured")

    link = f"https://t.me/{bot_name}?start={connect_token}"

    # сразу отправляем юзера в Telegram
    return HttpResponseRedirect(link)
