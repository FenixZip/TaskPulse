"""integrations/utils_telegram.py"""
import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)


def send_telegram_message(
    chat_id: int, text: str, reply_markup: dict | None = None
) -> None:
    """Отправляет сообщение пользователю в Telegram через Bot API."""

    bot_token = getattr(settings, "TELEGRAM_BOT_TOKEN", None)
    if not bot_token:
        logger.warning("TELEGRAM_BOT_TOKEN не настроен, сообщение не отправлено")
        return

    # ⬇формируем базовый URL метода sendMessage
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"

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
        resp = requests.post(url, json=payload, timeout=5)
        if resp.status_code != 200:
            logger.warning("Telegram API sendMessage error %s: %s", resp.status_code, resp.text)
    except Exception:  # noqa: BLE001
        logger.exception("Ошибка при отправке сообщения в Telegram")


def build_task_link(task_id: int) -> str:
    """Строит ссылку на задачу на фронтенде, чтобы вставить в сообщения Telegram."""

    # берём базовый URL фронтенда из настроек
    base = getattr(settings, "FRONTEND_BASE_URL", "http://localhost:3000").rstrip("/")
    # задачи открываются внутри SPA по /app/tasks/<id>
    return f"{base}/app/tasks/{task_id}"
