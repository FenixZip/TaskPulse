"""tests/accounts/test_auth_api.py"""

import pytest
from accounts.models import Invitation
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.mark.django_db
def test_register_creates_user(api_client):
    """
    Цель: POST /api/auth/register/ должен корректно создавать пользователя.
    Шаги:
    1) Отправляем корректные данные на /api/auth/register/.
    2) Проверяем статус 201.
    3) Убеждаемся, что пользователь появился в БД.
    """

    payload = {
        "email": "newuser@example.com",
        "full_name": "New User",
        "company": "ACME",
        "password": "StrongPass123",
    }

    # вызываем endpoint регистрации
    resp = api_client.post("/api/auth/register/", payload, format="json")
    # ожидаем успешное создание пользователя
    assert resp.status_code == 201, resp.content
    # пользователь с таким email должен существовать в базе
    assert User.objects.filter(email="newuser@example.com").exists()


@pytest.mark.django_db
def test_login_rejects_unverified_email(api_client, user_factory):
    """
    Цель: убедиться, что при НЕподтверждённой почте логин отклоняется.
    Шаги:
    1) Создаём пользователя (по умолчанию email считается неподтверждённым).
    2) Пытаемся войти с корректным паролем.
    3) Ожидаем статус 400 и сообщение о необходимости подтверждения почты.
    """

    # создаём пользователя с известным паролем
    user_factory(email="unverified@example.com", password="StrongPass123")
    # пробуем залогиниться с правильными данными
    resp = api_client.post(
        "/api/auth/login/",
        {"email": "unverified@example.com", "password": "StrongPass123"},
        format="json",
    )
    # логин должен быть отклонён
    assert resp.status_code == 400
    # проверяем, что в ошибке есть текст про подтверждение почты
    msg = "".join(resp.data.get("non_field_errors", []))
    assert "Подтвердите" in msg


@pytest.mark.django_db
def test_login_rejects_wrong_password(api_client, user_factory):
    """
    Цель: убедиться, что при неверном пароле логин отклоняется.
    Шаги:
    1) Создаём пользователя.
    2) Пытаемся войти с неправильным паролем.
    3) Ожидаем статус 400 и отсутствие токена в ответе.
    """

    # создаём пользователя с корректным паролем
    user_factory(email="rightpass@example.com", password="CorrectPass123")
    # пробуем войти с неверным паролем
    resp = api_client.post(
        "/api/auth/login/",
        {"email": "rightpass@example.com", "password": "WrongPass"},
        format="json",
    )
    # логин должен быть отклонён
    assert resp.status_code == 400
    # в ответе не должно быть токена
    assert "token" not in resp.data


@pytest.mark.django_db
def test_create_invitation_requires_auth(api_client):
    """
    Цель: убедиться, что POST /api/auth/invitations/ недоступен анонимному пользователю.
    Шаги:
    1) Анонимно отправляем POST на /api/auth/invitations/.
    2) Ожидаем статус 401 или 403.
    """

    resp = api_client.post(
        "/api/auth/invitations/",
        {"email": "invitee@example.com"},
        format="json",
    )
    # доступ для анонимного пользователя должен быть запрещён
    assert resp.status_code in (401, 403)


@pytest.mark.django_db
def test_create_invitation_by_authenticated_user(auth_client, creator):
    """
    Цель: POST /api/auth/invitations/ создаёт Invitation от имени текущего пользователя.
    Шаги:
    1) Авторизуемся пользователем-creator (делает фикстура auth_client).
    2) Отправляем POST /api/auth/invitations/ с email приглашённого.
    3) Проверяем статус 201.
    4) Убеждаемся, что Invitation создан и invited_by = creator.
    """

    payload = {
        "email": "invitee@example.com",
        # если в вашей модели Invitation есть дополнительное поле (например, target_role),
        # его можно добавить сюда при необходимости
    }
    # авторизованный creator создаёт инвайт
    resp = auth_client.post("/api/auth/invitations/", payload, format="json")
    # инвайт должен успешно создаться
    assert resp.status_code == 201, resp.content
    # проверяем, что Invitation действительно появился в БД
    inv = Invitation.objects.get(email="invitee@example.com")
    # инвайт должен быть привязан к текущему пользователю
    assert inv.invited_by == creator
