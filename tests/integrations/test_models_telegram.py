"""tests/test_models_telegram.py"""

import pytest
from integrations.models import TelegramProfile


@pytest.mark.django_db
def test_telegram_profile_basic_creation(executor):
    """
    Цель:
    Убедиться, что TelegramProfile корректно создаётся и связан с пользователем.
    """

    profile = TelegramProfile.objects.create(
        user=executor,
        telegram_user_id=777777,
        chat_id=111222333,
    )

    assert profile.user == executor
    assert profile.telegram_user_id == 777777
    assert profile.chat_id == 111222333
    assert str(profile)  # строковое представление не пустое
