"""conftest.py"""
from __future__ import annotations

import datetime
import shutil
import pytest
from django.core.files.base import ContentFile
from rest_framework.test import APIClient
from django.utils import timezone
from django.contrib.auth import get_user_model
from tasks.models import Task
from rest_framework.authtoken.models import Token


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


# Tasks

@pytest.fixture
def api_client():
    """Возвращает DRF APIClient для удобного вызова API"""
    return APIClient()

@pytest.fixture
def auth_client(api_client, creator, django_user_model):
    """ Возвращает авторизованный APIClient под пользователем-создателем"""
    token, _ = Token.objects.get_or_create(user=creator)
    api_client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
    return api_client

@pytest.fixture
def auth_client_executor(api_client, executor):
    """Возвращает авторизованный APIClient под пользователем-исполнителем"""
    token, _ = Token.objects.get_or_create(user=executor)
    api_client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
    return api_client

@pytest.fixture
def media_tmpdir(settings, tmp_path):
    """Временная директория для MEDIA, чтобы тесты файлов ничего не портил"""
    tmpdir = tmp_path / "media"
    tmpdir.mkdir(parents=True, exist_ok=True)
    settings.MEDIA_ROOT = tmpdir
    settings.MEDIA_URL = "/media/"
    yield tmpdir
    # Явная очистка (на всякий случай, tmp_path и так чистится)
    shutil.rmtree(tmpdir, ignore_errors=True)

@pytest.fixture
def task_factory(creator, executor):
    """Фабрика задач: создаёт Task с параметрами по умолчанию"""

    def _make_task(**kwargs):
        payload = dict(
            title=kwargs.pop("title", f"Task {timezone.now().timestamp()}"),
            description=kwargs.pop("description", "desc"),
            priority=kwargs.pop("priority", Task.Priority.MEDIUM),
            status=kwargs.pop("status", Task.Status.NEW),
            due_at=kwargs.pop("due_at", timezone.now() + datetime.timedelta(days=1)),
            creator=kwargs.pop("creator", creator),
            assignee=kwargs.pop("assignee", executor),
        )
        payload.update(kwargs)
        return Task.objects.create(**payload)

    return _make_task

@pytest.fixture
def sample_file():
    """Возвращает крошечный in-memory файл (txt), чтобы проверять загрузку вложений"""
    f = ContentFile(b"hello world", name="hello.txt")
    return f

@pytest.fixture
def email_locmem(settings):
    """Включает почтовый backend, который пишет письма в mail.outbox (in-memory)."""
    settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
    # чтобы не ловить IDNA-ошибки при формировании Message-ID
    settings.EMAIL_MESSAGE_ID_FQDN = "task-pulse.local"
    return True
