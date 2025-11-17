"""accounts/managers.py"""
from django.contrib.auth.base_user import BaseUserManager


class UserManager(BaseUserManager):
    """Менеджер пользователей для кастомной модели User.
    Используется в качестве `objects` у модели пользователя и
    обеспечивает корректное создание обычных пользователей и суперпользователей.
    """

    use_in_migrations = True

    def create_user(self, email, password=None, **extra_fields):
        """Создаёт обычного пользователя."""

        if not email:
            raise ValueError("Email обязателен")

        if not password:
            raise ValueError("Пароль обязателен")

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Создаёт суперпользователя (администратора)."""

        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if hasattr(self.model, "Role"):
            extra_fields.setdefault("role", self.model.Role.CREATOR)

        if not extra_fields.get("is_staff"):
            raise ValueError("Superuser должен иметь is_staff=True.")

        if not extra_fields.get("is_superuser"):
            raise ValueError("Superuser должен иметь is_superuser=True.")

        return self.create_user(email, password, **extra_fields)
