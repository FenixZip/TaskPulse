"""TaskPulse/integrations/urls.py"""

from django.urls import path
from rest_framework.routers import DefaultRouter

from integrations.views_api import TelegramProfileViewSet, TelegramLinkStartView
from integrations.views_telegram import TelegramWebhookView

app_name = "integrations"

router = DefaultRouter()

router.register(
    r"integrations/telegram/profile",
    TelegramProfileViewSet,
    basename="telegram-profile",
)

urlpatterns = []

urlpatterns += router.urls

urlpatterns += [
    path(
        "integrations/telegram/link-start/",
        TelegramLinkStartView.as_view(),
        name="telegram-link-start",
    ),

    path(
        "telegram/webhook/",
        TelegramWebhookView.as_view(),
        name="telegram-webhook",
    ),
]
