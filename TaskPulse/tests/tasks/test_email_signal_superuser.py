import pytest
from django.contrib.auth import get_user_model
from django.core import mail


@pytest.mark.django_db
def test_superuser_creation_sends_verification_email(email_locmem, settings):
    """
    Цель: при создании суперпользователя должен отправляться e-mail с подтверждением.

    Мы используем dummy backend (никакой реальной отправки),
    но проверяем, что письмо сформировано (mail.outbox пополнен).
    """
    User = get_user_model()
    # создаём суперпользователя через ORM (в реале ещё и createsuperuser команда так делает)
    su = User.objects.create_superuser(email="su@example.com", password="StrongPass123")
    # в outbox должно быть хотя бы одно письмо (сигнал на post_save(User))
    assert len(mail.outbox) >= 1
    # убедимся, что адрес получателя совпадает
    assert su.email in mail.outbox[-1].to
