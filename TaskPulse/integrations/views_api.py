"""TaskPulse/integrations/views_api.py"""

from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import TelegramProfile, TelegramLinkToken


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def telegram_profile(request):
    """
    GET /api/integrations/telegram/profile/

    Возвращает профиль Telegram текущего пользователя.
    - 200 + объект TelegramProfile, если привязка есть
    - 404, если Telegram ещё не привязан
    """
    try:
        profile = TelegramProfile.objects.get(user=request.user)
    except TelegramProfile.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    data = {
        "id": profile.id,
        "telegram_user_id": profile.telegram_user_id,
        "chat_id": profile.chat_id,
        "created_at": profile.created_at,
        "last_activity_at": profile.last_activity_at,
    }
    return Response(data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def telegram_link_start(request):
    """
    POST /api/integrations/telegram/link-start/

    Создаёт TelegramLinkToken для текущего пользователя и
    возвращает ссылку на бота вида
    https://t.me/<bot>?start=<token>
    """
    link = TelegramLinkToken.objects.create(user=request.user)

    bot_name = getattr(settings, "TELEGRAM_BOT_NAME", "").strip()
    if not bot_name:
        return Response(
            {"detail": "TELEGRAM_BOT_NAME is not configured."}, status=500
        )

    deep_link = f"https://t.me/{bot_name}?start={link.token}"
    return Response({"link": deep_link})
