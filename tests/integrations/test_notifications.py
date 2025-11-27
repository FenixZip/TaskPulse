"""tests/integrations/test_notifications.py"""

import pytest
import tasks.services.notifications as notifications_module
from integrations.models import TelegramProfile
from tasks.services.notifications import notify_task_assigned


@pytest.mark.django_db
def test_notify_task_assigned_skips_if_no_assignee(task_factory, monkeypatch):
    """
    Цель: если у задачи нет исполнителя (assignee is None),
    функция не должна пытаться отправлять сообщение в Telegram.
    """

    # создаём задачу без исполнителя
    task = task_factory(assignee=None)

    called = {"flag": False}

    def fake_send(chat_id, text, reply_markup=None):
        """Фейковая отправка — просто помечаем, что нас вызвали."""

        called["flag"] = True

    monkeypatch.setattr(
        notifications_module,
        "send_telegram_message",
        fake_send,
    )

    # вызываем код
    notify_task_assigned(task)

    # отправки быть не должно
    assert called["flag"] is False


@pytest.mark.django_db
def test_notify_task_assigned_skips_if_no_telegram_profile(
    task_factory, executor, monkeypatch
):
    """Цель: если у исполнителя нет TelegramProfile, уведомление не отправляется."""

    task = task_factory(assignee=executor)

    # на всякий случай удостоверимся, что профиля нет
    assert not TelegramProfile.objects.filter(user=executor).exists()

    called = {"flag": False}

    def fake_send(chat_id, text, reply_markup=None):
        """Фейковая отправка — просто помечаем, что нас вызвали."""
        called["flag"] = True

    monkeypatch.setattr(
        notifications_module,
        "send_telegram_message",
        fake_send,
    )

    notify_task_assigned(task)

    assert called["flag"] is False


@pytest.mark.django_db
def test_notify_task_assigned_sends_message_with_inline_keyboard(
    task_factory, executor, monkeypatch
):
    """
    Цель: при наличии TelegramProfile у исполнителя должно:
    - вызываться send_telegram_message с корректным chat_id,
    - текст содержать заголовок задачи и ссылку (build_task_link),
    - в reply_markup быть две inline-кнопки с нужными callback_data.
    """

    # создаём профиль телеграма для исполнителя
    profile = TelegramProfile.objects.create(
        user=executor,
        telegram_user_id=111111111,  # поле NOT NULL — заполняем любым ID
        chat_id=123456789,
    )

    task = task_factory(assignee=executor, title="Сделать отчёт")

    # хотим, чтобы ссылка была предсказуемой
    fake_link = "https://app.test/tasks/42"

    def fake_build_task_link(task_id: int) -> str:
        """Фейковый генератор ссылок: возвращает фиксированную ссылку."""

        # проверим, что task_id передан корректно
        assert task_id == task.id
        return fake_link

    # структура, в которую соберём аргументы вызова send_telegram_message
    captured = {}

    def fake_send(chat_id, text, reply_markup=None):
        """Фейковая отправка — просто сохраняем параметры вызова."""

        captured["chat_id"] = chat_id
        captured["text"] = text
        captured["reply_markup"] = reply_markup

    # подменяем функции в РЕАЛЬНОМ модуле notifications
    monkeypatch.setattr(
        notifications_module,
        "build_task_link",
        fake_build_task_link,
    )
    monkeypatch.setattr(
        notifications_module,
        "send_telegram_message",
        fake_send,
    )

    # вызываем функцию
    notify_task_assigned(task)

    # убедимся, что send_telegram_message вообще вызвалась
    assert captured, "ожидали вызов send_telegram_message"

    # проверяем chat_id
    assert captured["chat_id"] == profile.chat_id

    # текст должен содержать заголовок задачи и ссылку
    assert "Сделать отчёт" in captured["text"]
    assert fake_link in captured["text"]

    # проверяем inline-клавиатуру
    rm = captured["reply_markup"]
    assert isinstance(rm, dict)
    assert "inline_keyboard" in rm
    keyboard = rm["inline_keyboard"]

    # ожидаем одну строку с двумя кнопками
    assert len(keyboard) == 1
    assert len(keyboard[0]) == 2

    btn_extend, btn_confirm = keyboard[0]

    assert btn_extend["text"].startswith("⏰")
    assert btn_extend["callback_data"] == f"extend_1d:{task.id}"

    assert btn_confirm["text"].startswith("✅")
    assert btn_confirm["callback_data"] == f"confirm_on_time:{task.id}"
