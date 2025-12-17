"""integrations/serializers.py"""

from rest_framework import serializers

from integrations.models import TelegramProfile


class TelegramProfileSerializer(serializers.ModelSerializer):
    """Cериализатор профиля Telegram."""

    class Meta:
        model = TelegramProfile
        # user мы обычно не отдаём — он и так «текущий» (request.user)
        fields = ("id", "telegram_user_id", "chat_id", "created_at", "last_activity_at")
        read_only_fields = fields
