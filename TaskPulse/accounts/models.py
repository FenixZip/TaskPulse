"""accoounts"""
import uuid
from datetime import timedelta

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from .managers import UserManager

class User(AbstractUser):
    """Кастомная модель пользователя"""

    class Role(models.TextChoices):
        """Набор ролей"""
        CREATOR = "CREATOR", "Creator"
        EXECUTOR = "EXECUTOR", "Executor"

    username = None
    full_name = models.CharField(max_length=255, blank=True, default="")
    company     = models.CharField(max_length=255, blank=True, default="")
    position = models.CharField(
        max_length=255,
        blank=False,
        null=True,
        verbose_name="Должность",
    )
    role = models.CharField(
        max_length=24,
        choices=Role.choices,
        default=Role.CREATOR,
    )
    email = models.EmailField(unique=True)
    telegram_id = models.BigIntegerField(unique=True, db_index=True, null=True, blank=True)
    email_verified = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name", "company", "position"]

    def __str__(self):
        """Возвращает строковое представление пользователя для админки/отладчика."""
        return f"{self.email} -> {self.full_name} -> {self.company} -> {self.position} -> {self.role}"


class EmailVerificationToken(models.Model):
    """Токен подтверждения email: позволяет подтвердить адрес пользователя по ссылке."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="email_tokens")
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    used_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField()

    @classmethod
    def issue_for(cls, user, ttl_hours: int = 48):
        """Создаёт и возвращает новый токен подтверждения"""
        return cls.objects.create(
            user=user,
            expires_at=timezone.now() + timedelta(hours=ttl_hours),
        )

    def mark_used(self):
        """Помечает токен как использованный"""
        self.used_at = timezone.now()
        self.save(update_fields=["used_at"])

    def is_valid(self):
        """Проверяет валидность токена"""
        return self.used_at is None and timezone.now() <= self.expires_at


class Invitation(models.Model):
    """Приглашение исполнителя"""
    email = models.EmailField()
    invited_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="invitations")
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        """Связка кого пригласили и кто пригласил"""
        unique_together = ("email", "invited_by")

    def mark_accepted(self):
        """Помечает инвайт принятым, проставляя accepted_at."""
        self.accepted_at = timezone.now()
        self.save(update_fields=["accepted_at"])
