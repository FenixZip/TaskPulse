"""accounts/signals.py"""
from django.conf import settings
from django.core.mail import send_mail
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import EmailVerificationToken, Invitation, User


def _frontend_url(path: str) -> str:
    """Склеивает базовый FRONTEND_BASE_URL и относительный путь."""

    base = getattr(settings, "FRONTEND_BASE_URL", "").rstrip("/")
    return f"{base}{path}"


@receiver(post_save, sender=User)
def send_email_verification(sender, instance: User, created, **kwargs):
    """Обработчик сигнала post_save для User."""

    # чтобы PyCharm не ругался на неиспользуемые параметры
    _ = sender, kwargs

    if created and not instance.email_verified:
        token = EmailVerificationToken.issue_for(instance)
        verify_link = _frontend_url(f"/verify-email?token={token.token}")
        send_mail(
            subject="Подтвердите вашу почту",
            message=f"Перейдите по ссылке для подтверждения: {verify_link}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[instance.email],
        )


@receiver(post_save, sender=Invitation)
def send_invitation_email(sender, instance: Invitation, created, **kwargs):
    """
    Обработчик сигнала post_save для Invitation:
    при создании инвайта отправляет письмо приглашённому с ссылкой принятия.
    """

    _ = sender, kwargs  # чтобы IDE не показывала warning

    if created:
        link = _frontend_url(f"/accept-invite?token={instance.token}")
        send_mail(
            subject="Вас пригласили как Исполнителя",
            message=f"Вас пригласили в Task Pulse. Примите приглашение: {link}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[instance.email],
        )
