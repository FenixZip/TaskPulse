"""integrations/urls.py"""

from django.urls import path
from integrations.views_api import TelegramProfileViewSet
from integrations.views_telegram import TelegramWebhookView
from rest_framework.routers import DefaultRouter

# DRF-роутер для API-интерфейсов интеграций
router = DefaultRouter()

# /api/integrations/telegram/profile/
router.register(
    r"integrations/telegram/profile",
    TelegramProfileViewSet,
    basename="telegram-profile",
)

urlpatterns = []

# DRF-маршруты (список профилей для текущего пользователя)
urlpatterns += router.urls

# Обычный Django URL для вебхука Telegram:
# в итоге: /api/telegram/webhook/
urlpatterns += [
    path(
        "telegram/webhook/",
        TelegramWebhookView.as_view(),
        name="telegram-webhook",
    ),
]
