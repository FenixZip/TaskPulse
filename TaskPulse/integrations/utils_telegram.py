"""integrations/utils_telegram.py"""

import requests
from django.conf import settings


def send_telegram_message(
    chat_id: int, text: str, reply_markup: dict | None = None
) -> None:
    """Отправляет сообщение пользователю в Telegram через Bot API."""

    if not settings.TELEGRAM_BOT_TOKEN:
        return

    # ⬇формируем базовый URL метода sendMessage
    url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"

    # ⬇собираем полезную нагрузку (payload) для POST-запроса
    payload: dict = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
    }

    # ⬇если передали клавиатуру — добавляем её в payload
    if reply_markup is not None:
        payload["reply_markup"] = reply_markup

    # выполняем POST-запрос к Telegram
    try:
        requests.post(url, json=payload, timeout=5)
    except Exception:
        # в проде здесь нужно логировать ошибку, а не молча проглатывать
        # но чтобы не заваливать консоль во время разработки/тестов — просто pass
        pass


def build_task_link(task_id: int) -> str:
    """Строит ссылку на задачу на фронтенде, чтобы вставить в сообщения Telegram."""

    # берём базовый URL фронтенда из настроек
    base = getattr(settings, "FRONTEND_BASE_URL", "http://localhost:3000")
    # ⬇️ просто конкатенируем путь до задачи
    return f"{base}/tasks/{task_id}"
