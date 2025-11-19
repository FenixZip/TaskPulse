"""integrations/permissions.py"""

from django.conf import settings
from rest_framework.permissions import BasePermission


class IsTelegramWebhook(BasePermission):
    """
    Permission для DRF-вебхука Telegram (если решишь переписать его на APIView).
    Проверяет секрет в заголовке:
    X-Telegram-Bot-Api-Secret-Token == settings.TELEGRAM_WEBHOOK_SECRET
    """

    def has_permission(self, request, view) -> bool:
        secret = getattr(settings, "TELEGRAM_WEBHOOK_SECRET", None)
        if not secret:
            # если секрет не настроен — не даём доступ (лучше безопасно «запереть»)
            return False

        header_value = request.headers.get("X-Telegram-Bot-Api-Secret-Token")
        return header_value == secret
