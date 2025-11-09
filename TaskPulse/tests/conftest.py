"""conftest.py"""
from __future__ import annotations
import pytest
from django.utils import timezone
from django.contrib.auth import get_user_model


@pytest.fixture
def user_factory(db):
    """Фабрика пользователей"""
    User = get_user_model()

    def _make_user(**kwargs):
        """Значения по умолчанию, соответствующие требованиям кастомной модели"""
        payload = {
            "email": kwargs.pop("email", f"user_{timezone.now().timestamp()}@example.com"),
            "full_name": kwargs.pop("full_name", "Test User"),
            "company": kwargs.pop("company", "APPLE"),
            "password": kwargs.pop("password", "passqwe123"),
        }
        payload.update(kwargs)
        return User.objects.create_user(**payload)

    return _make_user

@pytest.fixture
def creator(user_factory):
    """"Создаёт пользователя с ролью CREATOR"""
    return user_factory(role="CREATOR")

@pytest.fixture
def executor(user_factory):
    """Создаёт пользователя с ролью EXECUTOR"""
    return user_factory(role="EXECUTOR")


