from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Task, TaskAttachment

User = get_user_model()


class TaskAttachmentSerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели TaskAttachment.
    Отвечает за приём/выдачу данных по файлам, связанным с задачей.
    """

    file_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = TaskAttachment
        fields = ("id", "task", "file", "file_url", "uploaded_by", "created_at")
        read_only_fields = ("id", "uploaded_by", "created_at", "task")

    def get_file_url(self, obj):
        """Возвращает абсолютный URL файла (или None, если файла нет)."""

        request = self.context.get("request")
        # Если у объекта нет файла — вернём None
        if not obj.file:
            return None
        # Берём "сырой" URL из FileField (обычно /media/...)
        file_url = getattr(obj.file, "url", None)
        # Если storage не отдаёт url — на всякий случай вернём None
        if not file_url:
            return None
        # Если request есть — превратим относительный путь в абсолютный (http://127.0.0.1:8000/media/...)
        return request.build_absolute_uri(file_url) if request else file_url

    def create(self, validated_data):
        """Создаёт вложение и проставляет uploaded_by = текущий пользователь."""

        # Достаём request из контекста, IDE-подсказки уйдут
        request = self.context.get("request")
        # Если по какой-то причине request не передали — бросим понятную ошибку разработчику
        assert request is not None, "Request must be provided in serializer context"
        # Берём текущего пользователя из запроса
        user = request.user
        # Создаём вложение и проставляем, кто загрузил
        attachment = TaskAttachment.objects.create(uploaded_by=user, **validated_data)
        # Возвращаем созданный объект
        return attachment


class TaskSerializer(serializers.ModelSerializer):
    """Сериализатор задачи для чтения: отдаём все ключевые поля и вложения."""

    attachments = TaskAttachmentSerializer(many=True, read_only=True)
    priority_display = serializers.CharField(source="get_priority_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Task
        fields = (
            "id", "title", "description",
            "priority", "priority_display",
            "status", "status_display",
            "due_at", "creator", "assignee",
            "created_at", "updated_at",
            "attachments",
        )
        read_only_fields = ("id", "creator", "created_at", "updated_at")


class TaskUpsertSerializer(serializers.ModelSerializer):
    """
    Сериализатор задачи для создания/изменения.
    На create автоматически проставит creator = request.user.
    """

    class Meta:
        model = Task
        fields = ("title", "description", "priority", "status", "due_at", "assignee")

    def create(self, validated_data):
        """Создаёт задачу, проставляя создателя из текущего пользователя."""

        user = self.context["request"].user
        task = Task.objects.create(creator=user, **validated_data)
        return task


class TaskActionSerializer(serializers.Serializer):
    """
    Универсальный сериализатор действий над задачей.

    Поддерживает:
    - confirm_on_time: подтверждение, что исполнитель успеет к дедлайну
    - extend_1d: продление срока на сутки с комментарием
    """

    comment = serializers.CharField(required=False, allow_blank=True, max_length=500)

    def validate(self, attrs):
        """Проверяем, что при extend_1d пришёл комментарий."""

        action = self.context.get("action")
        if action == "extend_1d" and not attrs.get("comment"):
            raise serializers.ValidationError("Для продления на сутки обязателен комментарий")
        return attrs
