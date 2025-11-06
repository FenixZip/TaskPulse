"""permissions.py"""
from rest_framework.permissions import BasePermission
from .models import User


class IsCreator(BasePermission):
    """
    Разрешение, которое пропускает только аутентифицированных пользователей с ролью CREATOR."""

    def has_permission(self, request, view):
        """Возвращает True, если пользователь аутентифицирован и имеет роль CREATOR."""
        return bool(request.user and request.user.is_authenticated and request.user.role == User.Role.CREATOR)
