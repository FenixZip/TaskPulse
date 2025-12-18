# TaskPulse/tasks/tasks.py
"""
Celery autodiscover по умолчанию ищет tasks.py в INSTALLED_APPS.
Этот файл импортирует реальные задачи из tasks_reminders.py, чтобы они зарегистрировались.
"""

from .tasks_reminders import *  # noqa: F403,F401
