"""Тесты модели User из приложения accounts."""
import pytest
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.db.models import Index


pytestmark = pytest.mark.django_db

def test_default_role_creator_when_no_inviter():
    """
    Проверяет: если пользователь создаётся без invited_by и без явной role,
    метод save() проставит роль по умолчанию — CREATOR.
    """
    User = get_user_model()
    u = User.objects.create_user(username="Serz", password="pass123")
    assert u.role == User.Roles.CREATOR

def test_default_role_executor_when_invited():
    """По умолчанию присваивается роль EXECUTOR"""
    User = get_user_model()
    inviter = User.objects.create_user(username="boss", password="pass123", role=User.Roles.CREATOR)
    invited = User.objects.create_user(username="bob", password="pass123", invited_by=inviter)
    assert invited.role == User.Roles.EXECUTOR
    assert invited.invited_by == inviter
    assert invited in inviter.invited_users.all()

def test_explicit_role_is_respected_on_create():
    """Если при создании явно указать role, метод save() НЕ должен её менять."""
    User = get_user_model()
    u = User.objects.create_user(username="carol", password="pass123", role=User.Roles.EXECUTOR)
    assert u.role == User.Roles.EXECUTOR

def test_telegram_id_unique():
    """Поле telegram_id уникально"""
    User = get_user_model()
    User.objects.create_user(username="d1", password="x", telegram_id="tg-1", role=User.Roles.CREATOR)
    with pytest.raises(IntegrityError):
        User.objects.create_user(username="d2", password="x", telegram_id="tg-1", role=User.Roles.CREATOR)

def test_str_representation_includes_username_and_role():
    """Возвращает строку username> <ROLE"""
    User = get_user_model()
    u = User.objects.create_user(username="dave", password="x", role=User.Roles.CREATOR)
    assert str(u) == "dave (CREATOR)"
