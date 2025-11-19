"""accounts/auth_backend.py"""

from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend

User = get_user_model()


class EmailBackend(ModelBackend):
    """Бэкенд аутентификации по email."""

    def authenticate(self, request, username=None, email=None, password=None, **kwargs):
        """Пытается аутентифицировать пользователя по email/паролю."""

        login = email or username
        if login is None or password is None:
            return None
        try:
            user = User.objects.get(email=login)
        except User.DoesNotExist:
            return None

        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        # Если пароль верный — возвращаем пользователя
        return None
