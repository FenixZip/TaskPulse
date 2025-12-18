# TaskPulse/integrations/tasks.py

from __future__ import annotations

from celery import shared_task

from .telegram_webhook import handle_telegram_update


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 5})
def process_telegram_update(self, update: dict) -> None:
    """Обрабатывает Telegram update в фоне (Celery)."""

    handle_telegram_update(update)
