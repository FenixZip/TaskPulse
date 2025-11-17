"""permissions.py"""
from rest_framework.permissions import BasePermission
from django.contrib.auth import get_user_model


User = get_user_model()

class IsCreator(BasePermission):
    """
    Разрешение, которое пропускает только аутентифицированных пользователей с ролью CREATOR."""

    def has_permission(self, request, view):
        """Возвращает True, если пользователь аутентифицирован и имеет роль CREATOR."""
        user = request.user
        return bool(user and user.is_authenticated and user.role == User.Role.CREATOR)
