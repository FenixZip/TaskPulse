from rest_framework.permissions import BasePermission
from django.contrib.auth import get_user_model
from .models import Task

User = get_user_model()


class IsCreatorOrAssignee(BasePermission):
    """
    Пускает к изменению задачи только её создателя или назначенного исполнителя.
    На чтение доступ может быть шире (это решим во viewset).
    """

    def has_object_permission(self, request, view, obj: Task):
        """Проверяет доступ к конкретному объекту."""

        if not request.user or not request.user.is_authenticated:
            return False
        if obj.creator_id == request.user.id:
            return True
        if obj.assignee_id == request.user.id:
            return True
        return False
