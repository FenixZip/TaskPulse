"""tasks/permissions.py"""
from django.contrib.auth import get_user_model
from rest_framework.permissions import BasePermission

from .models import Task

User = get_user_model()


class IsCreatorOrAssignee(BasePermission):
    """
    Пускает к изменению задачи только её создателя или назначенного исполнителя.
    На чтение доступ может быть шире (это решается во viewset).
    """

    def has_object_permission(self, request, view, obj: Task) -> bool:
        """Проверяет доступ к конкретному объекту."""

        user = request.user
        if not user or not user.is_authenticated:
            return False
        return obj.creator_id == user.id or obj.assignee_id == user.id
