"""TaskPulse/integrations/telegram_api.py"""

from typing import cast

from django.conf import settings
from django.http import (
    HttpRequest,
    HttpResponse,
    HttpResponseBadRequest,
    HttpResponseForbidden,
    HttpResponseRedirect,
    JsonResponse,
)
from rest_framework.authtoken.models import Token

from .models import TelegramLinkToken


def telegram_connect_start(request: HttpRequest) -> HttpResponse:
    """
    GET /api/integrations/telegram/connect/?token=<auth_token>

    1. По DRF-токену находим пользователя.
    2. Создаём одноразовый TelegramLinkToken, связанный с этим пользователем.
    3. Строим deep-link:
         https://t.me/<TELEGRAM_BOT_NAME>?start=<link_token>
    4. Делаем redirect на этот deep-link.

    НИКАКИХ операций с TelegramProfile здесь нет —
    профиль создаётся/обновляется уже в webhook-е,
    когда Telegram присылает update с этим start-token.
    """

    raw_token = request.GET.get("token")
    if not raw_token:
        return HttpResponseBadRequest("Missing token")

    # находим пользователя по DRF-токену
    try:
        token_obj = Token.objects.get(key=raw_token)
    except Token.DoesNotExist:
        return HttpResponseForbidden("Invalid token")

    user = token_obj.user

    try:
        # создаём новый link token для этого пользователя
        link = TelegramLinkToken.objects.create(user=user)
    except Exception as exc:  # на всякий случай, чтобы не ронять сервер
        return JsonResponse(
            {"detail": f"Failed to create link token: {exc!s}"},
            status=500,
        )

    bot_name = cast(str, getattr(settings, "TELEGRAM_BOT_NAME", "")).strip()
    if not bot_name:
        return JsonResponse(
            {"detail": "TELEGRAM_BOT_NAME is not configured in settings."},
            status=500,
        )

    deep_link = f"https://t.me/{bot_name}?start={link.token}"

    # обычный HTTP-редирект в Telegram
    return HttpResponseRedirect(deep_link)
