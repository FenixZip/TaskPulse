"""TaskPulse/celery_app.py"""
from __future__ import annotations

import os

from celery import Celery

# Указываем Django, какие настройки использовать при запуске Celery
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "TaskPulse.settings")

# Создаём экземпляр Celery-приложения с именем проекта
celery_app = Celery("TaskPulse")

# Говорим Celery читать конфиг из Django-настроек с префиксом "CELERY_"
celery_app.config_from_object("django.conf:settings", namespace="CELERY")

# Автоматически искать tasks.py во всех установленных приложениях Django
celery_app.autodiscover_tasks()

__all__ = ("celery_app",)
