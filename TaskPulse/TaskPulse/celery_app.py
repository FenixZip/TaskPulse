# TaskPulse/celery_app.py
import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "TaskPulse.settings")

celery_app = Celery("TaskPulse")

# берём настройки Celery из Django settings с префиксом CELERY_
celery_app.config_from_object("django.conf:settings", namespace="CELERY")

# автоматически находим tasks.py во всех приложениях
celery_app.autodiscover_tasks()
