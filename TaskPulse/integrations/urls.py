"""TaskPulse/integrations/urls.py"""

from django.urls import path
from rest_framework.routers import DefaultRouter

from integrations.views_api import TelegramProfileViewSet, TelegramLinkStartView
from integrations.views_telegram import TelegramWebhookView

app_name = "integrations"

router = DefaultRouter()

# /api/integrations/telegram/profile/
router.register(
    r"integrations/telegram/profile",
    TelegramProfileViewSet,
    basename="telegram-profile",
)

urlpatterns = []

# DRF-маршруты (профиль Telegram текущего пользователя)
urlpatterns += router.urls

# Обычные Django URL'ы
urlpatterns += [
    # deep-link для старта привязки Telegram
    # ИТОГОВЫЙ ПУТЬ: /api/integrations/telegram/link-start/
    path(
        "integrations/telegram/link-start/",
        TelegramLinkStartView.as_view(),
        name="telegram-link-start",
    ),
    # вебхук Telegram (BotFather настраиваем сюда)
    # ИТОГОВЫЙ ПУТЬ: /api/telegram/webhook/
    path(
        "telegram/webhook/",
        TelegramWebhookView.as_view(),
        name="telegram-webhook",
    ),
]
