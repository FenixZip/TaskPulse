"""
Корневой URL-конфиг проекта TaskPulse.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from integrations.telegram_api import telegram_connect_start  # можно оставить, если используешь
from integrations.telegram_webhook import telegram_webhook
from integrations.views_api import telegram_profile, telegram_link_start

app_name = "TaskPulse"

urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/auth/", include("accounts.urls")),

    path("api/tasks/", include("tasks.urls")),

    path(
        "api/integrations/telegram/profile/",
        telegram_profile,
        name="telegram-profile",
    ),
    path(
        "api/integrations/telegram/link-start/",
        telegram_link_start,
        name="telegram-link-start",
    ),

    path(
        "api/integrations/telegram/connect/",
        telegram_connect_start,
        name="telegram-connect-start",
    ),
    path(
        "api/integrations/telegram/webhook/<str:secret>/",
        telegram_webhook,
        name="telegram-webhook",
    ),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
