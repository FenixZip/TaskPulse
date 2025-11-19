"""integrations/models.py"""

import uuid

from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()


class TelegramProfile(models.Model):
    """TelegramProfile - хранит связь между пользователем и его Telegram-аккаунтом."""

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="telegram_profile",
    )

    telegram_user_id = models.BigIntegerField(unique=True)
    chat_id = models.BigIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        """Строковое представление объекта, удобно для админки и логов."""

        return f"{self.user.email} (telegram {self.telegram_user_id})"  # pylint: disable=no-member


class TelegramUpdate(models.Model):
    """TelegramUpdate - Хранит уже обработанные update_id для обеспечения идемпотентности."""

    update_id = models.BigIntegerField(unique=True)
    processed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        """Строковое представление объекта."""

        return f"update {self.update_id}"


class TelegramLinkToken(models.Model):
    """
    TelegramLinkToken:
    Одноразовый токен, который пользователь вставляет в /start <token>,
    чтобы привязать свой Telegram к аккаунту.
    """

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="telegram_link_token",
    )

    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        """Строковое представление токена."""

        return f"{self.user.email} -> {self.token}"  # pylint: disable=no-member
