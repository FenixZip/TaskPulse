"""tests/integrations/test_utils_telegram.py"""

import pytest
from integrations.utils_telegram import build_task_link, send_telegram_message


@pytest.mark.django_db
def test_build_task_link_uses_frontend_base_url(settings):
    """
    Цель:
    build_task_link(task_id) должен использовать FRONTEND_BASE_URL
    и подставлять id задачи в ссылку.
    """

    settings.FRONTEND_BASE_URL = "https://front.test"

    link = build_task_link(42)

    assert "https://front.test" in link
    # не жёстко завязываемся на конкретный путь, но id должен присутствовать
    assert "42" in link


def test_send_telegram_message_posts_to_telegram(monkeypatch, settings):
    """
    Цель:
    send_telegram_message должен делать HTTP POST на Telegram API
    c корректным URL и полезной нагрузкой.
    """

    settings.TELEGRAM_BOT_TOKEN = "TEST_BOT_TOKEN"

    captured = {}

    def fake_post(url, json=None, timeout=None):
        """Фейк requests.post: сохраняет параметры вызова."""

        captured["url"] = url
        captured["json"] = json
        captured["timeout"] = timeout

        class DummyResponse:
            status_code = 200

        return DummyResponse()

    # Подменяем requests.post в модуле integrations.utils_telegram
    monkeypatch.setattr(
        "integrations.utils_telegram.requests.post",
        fake_post,
    )

    # Данные для отправки
    chat_id = 123456789
    text = "Привет из теста"
    reply_markup = {"inline_keyboard": [[{"text": "OK", "callback_data": "ok"}]]}

    send_telegram_message(chat_id, text, reply_markup=reply_markup)

    # Проверяем, что токен попал в URL
    assert "TEST_BOT_TOKEN" in captured["url"]

    payload = captured["json"]
    assert payload["chat_id"] == chat_id
    assert payload["text"] == text
    # parse_mode по умолчанию 'HTML' (если именно так реализовано в utils)
    assert payload.get("parse_mode") in (None, "HTML")
    assert payload.get("reply_markup") == reply_markup
