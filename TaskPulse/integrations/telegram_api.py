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
    """Подключение к Телеграм"""

    raw_token = request.GET.get("token")
    if not raw_token:
        return HttpResponseBadRequest("Missing token")

    try:
        token_obj = Token.objects.get(key=raw_token)
    except Token.DoesNotExist:
        return HttpResponseForbidden("Invalid token")

    user = token_obj.user

    try:
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

    return HttpResponseRedirect(deep_link)
