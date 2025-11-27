"""TaskPulse/integrations/notifications.py"""
import requests
from django.conf import settings


def send_telegram_message(chat_id: int, text: str) -> None:
    token = settings.TELEGRAM_BOT_TOKEN
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
    }
    resp = requests.post(url, json=payload, timeout=10)
    resp.raise_for_status()
