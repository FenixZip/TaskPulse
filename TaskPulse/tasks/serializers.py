"""tasks/serializers"""

from typing import Any, Dict, Optional

from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Task, TaskAttachment

User = get_user_model()


class TaskAttachmentSerializer(serializers.ModelSerializer):
    """Сериализатор для модели TaskAttachment.
    Отвечает за приём/выдачу данных по файлам, связанным с задачей.
    Дополнительно отдаёт поле `file_url` с абсолютной ссылкой на файл.
    """

    file_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = TaskAttachment
        fields = ("id", "task", "file", "file_url", "uploaded_by", "created_at")
        # task задаётся, как правило, через URL или во view, а не руками из запроса
        read_only_fields = ("id", "uploaded_by", "created_at", "task")

    def get_file_url(self, obj: TaskAttachment) -> Optional[str]:
        """Возвращает абсолютный URL файла (или None, если файла нет/URL получить нельзя)."""

        request = self.context.get("request")
        if not obj.file:
            return None

        file_url = getattr(obj.file, "url", None)
        if not file_url:
            return None

        return request.build_absolute_uri(file_url) if request else file_url

    def create(self, validated_data: Dict[str, Any]) -> TaskAttachment:
        """Создаёт вложение и проставляет `uploaded_by` текущим пользователем."""

        request = self.context.get("request")
        # Если по какой-то причине request не передали — бросим понятную ошибку разработчику.
        assert request is not None, "Request must be provided in serializer context"

        user: User = request.user
        attachment = TaskAttachment.objects.create(uploaded_by=user, **validated_data)
        return attachment


class TaskSerializer(serializers.ModelSerializer):
    """Сериализатор задачи для чтения.
    Отдаёт все ключевые поля задачи, а также связанные вложения.
    Дополнительно возвращает display-представления для приоритета и статуса.
    """

    attachments = TaskAttachmentSerializer(many=True, read_only=True)
    priority_display = serializers.CharField(
        source="get_priority_display", read_only=True
    )
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Task
        fields = (
            "id",
            "title",
            "description",
            "priority",
            "priority_display",
            "status",
            "status_display",
            "due_at",
            "creator",
            "assignee",
            "created_at",
            "updated_at",
            "attachments",
        )
        read_only_fields = ("id", "creator", "created_at", "updated_at")


class TaskUpsertSerializer(serializers.ModelSerializer):
    """Сериализатор задачи для создания и изменения."""

    class Meta:
        model = Task
        fields = ("title", "description", "priority", "status", "due_at", "assignee")

    def create(self, validated_data: Dict[str, Any]) -> Task:
        """Создаёт задачу, проставляя создателя из текущего пользователя."""

        request = self.context.get("request")
        assert request is not None, "Request must be provided in serializer context"

        user: User = request.user
        task = Task.objects.create(creator=user, **validated_data)
        return task


class TaskActionSerializer(serializers.Serializer):
    """Универсальный сериализатор действий над задачей."""

    comment = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=500,
        help_text="Комментарий к действию над задачей (обязателен для некоторых действий).",
    )

    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        """Проводит межполевую валидацию."""

        action = self.context.get("action")
        if action == "extend_1d" and not attrs.get("comment"):
            raise serializers.ValidationError(
                "Для продления на сутки обязателен комментарий"
            )
        return attrs
