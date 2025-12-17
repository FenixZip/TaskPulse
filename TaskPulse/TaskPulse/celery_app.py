# TaskPulse/celery_app.py

import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "TaskPulse.settings")

celery_app = Celery("TaskPulse")

celery_app.config_from_object("django.conf:settings", namespace="CELERY")

celery_app.autodiscover_tasks()
