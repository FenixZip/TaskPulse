"""
URL configuration for TaskPulse project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from integrations.telegram_api import telegram_connect_start
from integrations.telegram_webhook import telegram_webhook

"""Корневой URL-конфиг проекта TaskPulse."""

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
    # Задачи и отчёты (tasks + reports/monthly)
    path("api/", include("tasks.urls")),
    # Интеграции (Telegram: webhook + API-профиль)
    path("api/integrations/telegram/connect/", telegram_connect_start, name="telegram-connect-start"),
    path(
        f"api/integrations/telegram/webhook/<str:secret>/",
        telegram_webhook,
        name="telegram-webhook",
    ),
]

# В dev-режиме раздаём медиа-файлы через Django
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
