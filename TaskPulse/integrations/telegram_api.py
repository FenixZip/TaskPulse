"""TaskPulse/integrations/telegram_api.py"""
import secrets

from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpRequest

from .models import TelegramProfile


@login_required
def telegram_connect_start(request: HttpRequest):
    user = request.user

    # генерим/обновляем одноразовый токен
    token = secrets.token_urlsafe(16)

    profile, _ = TelegramProfile.objects.get_or_create(
        user=user,
        defaults={"telegram_user_id": 0, "chat_id": 0},
    )
    profile.connect_token = token
    profile.is_confirmed = False
    profile.save(update_fields=["connect_token", "is_confirmed"])

    bot_name = "<ИМЯ_ТВОЕГО_БОТА_БЕЗ_@>"  # например PulseZoneBot
    link = f"https://t.me/{bot_name}?start={token}"

    return JsonResponse({"link": link})
