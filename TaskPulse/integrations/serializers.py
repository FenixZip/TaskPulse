"""integrations/serializers.py"""

from integrations.models import TelegramProfile
from rest_framework import serializers


class TelegramProfileSerializer(serializers.ModelSerializer):
    """
    Простейший сериализатор профиля Telegram.
    Используется, если нужно отдать на фронт информацию о том,
    привязан ли у текущего пользователя телеграм.
    """

    class Meta:
        model = TelegramProfile
        # user мы обычно не отдаём — он и так «текущий» (request.user)
        fields = ("id", "telegram_user_id", "chat_id", "created_at", "last_activity_at")
        read_only_fields = fields
