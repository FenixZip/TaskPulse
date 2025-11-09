from datetime import timedelta

import pytest
from django.db import IntegrityError
from django.utils import timezone

from accounts.models import EmailVerificationToken, Invitation # noqa: F401


@pytest.mark.django_db
def test_user_str_representation(creator):
    """Проверяем человекочитаемое представление пользователя"""
    expected = f"{creator.email} -> {creator.full_name} -> {creator.company} -> {creator.role}"
    assert str(creator) == expected

@pytest.mark.django_db
def test_user_email_uniqueness(user_factory):
    """Проверяем уникальность email"""
    first = user_factory(email='unique@example.com')
    with pytest.raises(IntegrityError):
        user_factory(email=first.email)

@pytest.mark.django_db
def test_user_telegram_id_uniqueness_allows_null(user_factory):
    """Проверяем, что telegram_id уникален"""
    u1 = user_factory(telegram_id=None)
    u2 = user_factory(telegram_id=None)
    assert u1.telegram_id is None and u2.telegram_id is None

    u1.telegram_id = 1234567890
    u1.save(update_fields=['telegram_id'])

    u2.telegram_id = 1234567890

    with pytest.raises(IntegrityError):
        u2.save(update_fields=['telegram_id'])

@pytest.mark.django_db
def test_user_defaults(user_factory):
    """Проверяем значения по умолчанию"""
    user = user_factory()
    assert user.role == "CREATOR"
    assert user.email_verified is False
    empty_user = user_factory(full_name="", company="")
    assert empty_user.full_name == ""
    assert empty_user.company == ""


# ТЕСТЫ EmailVerificationToken (EVT)

@pytest.mark.django_db
def test_evt_issue_for_creates_valid_token(creator):
    """Проверяем EmailVerificationToken"""
    start = timezone.now()
    evt = EmailVerificationToken.issue_for(creator)
    assert evt.pk is not None
    assert evt.user_id == creator.id
    assert evt.expires_at > start
    assert timedelta(hours=47, minutes=59) < (evt.expires_at - start) <= timedelta(hours=48, minutes=1)

    ev2 = EmailVerificationToken.issue_for(creator)
    assert evt.token != ev2.token

@pytest.mark.django_db
def test_evt_is_valid_true_until_used_or_expired(creator):
    """Проверяем логику is_valid()"""
    evt = EmailVerificationToken.issue_for(creator, ttl_hours=1)

    # На старте токен не использован и не просрочен — is_valid() должно быть True
    assert evt.used_at is None
    assert evt.is_valid() is True

    # После пометки использованным токен должен стать невалидным
    evt.mark_used()
    # Перечитаем из БД, чтобы убедиться, что persisted значение учитывается
    evt_refetched = EmailVerificationToken.objects.get(pk=evt.pk)
    assert evt_refetched.used_at is not None
    assert evt_refetched.is_valid() is False

    # Смоделируем просрочку: вручную передвинем expires_at в прошлое и проверим is_valid() == False
    evt_refetched.used_at = None  # Сбросим, чтобы проверить исключительно истечение срока
    evt_refetched.expires_at = timezone.now() - timedelta(seconds=1)
    evt_refetched.save(update_fields=["used_at", "expires_at"])
    assert evt_refetched.is_valid() is False

@pytest.mark.django_db
def test_evt_mark_used_idempotent_like(creator):
    """Проверяем, что повторные вызовы mark_used() не приводят к ошибкам"""
    evt = EmailVerificationToken.issue_for(creator)
    evt.mark_used()
    first_used_at = evt.used_at
    assert first_used_at is not None

    # Повторный вызов не должен ронять исключение, used_at останется заполненным (время может обновиться)
    evt.mark_used()
    assert evt.used_at is not None


# ТЕСТЫ Invitation (уникальности и методы)

@pytest.mark.django_db
def test_invitation_unique_together_email_invited_by(creator):
    """Проверяем ограничение"""
    inv1 = Invitation.objects.create(email="worker@example.com", invited_by=creator)
    assert inv1.pk is not None
    # Повторная попытка для того же (email, invited_by) должна упасть по уникальности
    with pytest.raises(IntegrityError):
        Invitation.objects.create(email="worker@example.com", invited_by=creator)

@pytest.mark.django_db
def test_invitation_allows_same_email_from_different_inviter(creator, user_factory):
    """Проверяем, что одинаковый email можно пригласить разными приглашающими"""
    other_inviter = user_factory(role="CREATOR")

    # Создаём два инвайта на один email, но от разных приглашающих
    inv1 = Invitation.objects.create(email="dup@example.com", invited_by=creator)
    inv2 = Invitation.objects.create(email="dup@example.com", invited_by=other_inviter)

    # Оба объекта должны сохраниться — пара (email, invited_by) различается
    assert inv1.pk is not None and inv2.pk is not None
    assert inv1.invited_by_id != inv2.invited_by_id

@pytest.mark.django_db
def test_invitation_mark_accepted_sets_timestamp(creator):
    """Проверяем, что mark_accepted() устанавливает accepted_at и сохраняет в БД"""
    inv = Invitation.objects.create(email="worker2@example.com", invited_by=creator)

    # До вызова отметки принятия поле пустое
    assert inv.accepted_at is None

    # Вызываем метод доменной модели
    inv.mark_accepted()

    # Перечитываем объект из БД, чтобы убедиться в персистентности изменений
    refreshed = Invitation.objects.get(pk=inv.pk)
    assert refreshed.accepted_at is not None

@pytest.mark.django_db
def test_invitation_token_is_uuid_and_unique(creator):
    """Базовая проверка того, что поле token — UUID и оно уникально"""
    inv1 = Invitation.objects.create(email="uniq1@example.com", invited_by=creator)
    inv2 = Invitation.objects.create(email="uniq2@example.com", invited_by=creator)

    assert inv1.token != inv2.token
    import uuid as _uuid  # локальный импорт, чтобы не загрязнять пространство имён выше

    assert isinstance(inv1.token, _uuid.UUID)
    assert isinstance(inv2.token, _uuid.UUID)
