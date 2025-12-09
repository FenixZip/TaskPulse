"""
Корневой URL-конфиг проекта TaskPulse.
"""

from integrations.telegram_api import telegram_connect_start  # можно оставить, если используешь
from integrations.telegram_webhook import telegram_webhook
from integrations.views_api import telegram_profile, telegram_link_start

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

app_name = "TaskPulse"

urlpatterns = [
    # Админка Django
    path("admin/", admin.site.urls),

    # Авторизация / регистрация / инвайты
    path("api/auth/", include("accounts.urls")),

    # Задачи и отчёты
    # Эндпоинты задач и отчётов живут под префиксом /api/tasks/
    #   /api/tasks/                    - список/создание задач
    #   /api/tasks/{id}/               - детали/редактирование
    #   /api/tasks/cabinet/...         - кабинеты
    path("api/tasks/", include("tasks.urls")),

    # --- TELEGRAM API для фронта ---
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

    # --- TELEGRAM: redirect + webhook (бот) ---
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
