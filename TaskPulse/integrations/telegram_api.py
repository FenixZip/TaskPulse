"""TaskPulse/integrations/telegram_api.py"""

import secrets
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

from .models import TelegramProfile


def telegram_connect_start(request: HttpRequest) -> HttpResponse:
    """
    GET /api/integrations/telegram/connect/?token=<auth_token>

    1. По DRF-токену находим пользователя.
    2. Получаем или создаём TelegramProfile для этого пользователя.
    3. Генерируем одноразовый connect_token.
    4. Сохраняем его в профиле.
    5. Редиректим в https://t.me/<TELEGRAM_BOT_NAME>?start=<connect_token>.
    """

    # 1. Забираем токен из query-параметров
    raw_token = request.GET.get("token")
    if not raw_token:
        return HttpResponseBadRequest("Missing token")

    # 2. Ищем пользователя по DRF-токену
    try:
        token_obj = Token.objects.get(key=raw_token)
    except Token.DoesNotExist:
        return HttpResponseForbidden("Invalid token")

    user = token_obj.user

    # 3. Получаем или создаём TelegramProfile ТОЛЬКО по user.
    #    Никаких defaults с telegram_user_id=0, чтобы не ловить unique-ошибку.
    connect_token = secrets.token_urlsafe(16)

    try:
        profile, _ = TelegramProfile.objects.get_or_create(user=user)
        # предполагаем, что в модели есть поля connect_token и is_confirmed
        profile.connect_token = connect_token  # type: ignore[attr-defined]
        profile.is_confirmed = False  # type: ignore[attr-defined]
        profile.save(update_fields=["connect_token", "is_confirmed"])  # type: ignore[attr-defined]
    except Exception as exc:  # pylint: disable=broad-except
        return JsonResponse(
            {"detail": f"Failed to prepare Telegram profile: {exc!s}"},
            status=500,
        )

    # 4. Формируем deep-link на бота
    bot_name = cast(str, getattr(settings, "TELEGRAM_BOT_NAME", "")).strip()
    if not bot_name:
        return JsonResponse(
            {"detail": "TELEGRAM_BOT_NAME is not configured in settings."},
            status=500,
        )

    link = f"https://t.me/{bot_name}?start={connect_token}"

    # 5. Отправляем пользователя сразу в Telegram
    return HttpResponseRedirect(link)
