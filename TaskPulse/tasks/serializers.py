"""tasks/serializers"""

from typing import Any, Dict, Optional

from django.contrib.auth import get_user_model
from rest_framework import serializers

from integrations.models import TelegramProfile
from .models import Task, TaskAttachment, TaskMessage

User = get_user_model()


class TaskAttachmentSerializer(serializers.ModelSerializer):
    """Сериализатор для модели TaskAttachment.
    Отвечает за приём/выдачу данных по файлам, связанным с задачей.
    Дополнительно отдаёт поле `file_url` с абсолютной ссылкой на файл.
    """

    file_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = TaskAttachment
        fields = ("id", "task", "file", "file_url", "kind", "uploaded_by", "created_at")
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


class TaskMessageSerializer(serializers.ModelSerializer):
    """Сообщение в чате по задаче."""

    sender_name = serializers.SerializerMethodField(read_only=True)
    is_from_creator = serializers.SerializerMethodField(read_only=True)
    is_from_executor = serializers.SerializerMethodField(read_only=True)
    file_url = serializers.SerializerMethodField(read_only=True)
    task_title = serializers.CharField(source="task.title", read_only=True)

    class Meta:
        model = TaskMessage
        fields = (
            "id",
            "task",
            "task_title",
            "sender",
            "sender_name",
            "text",
            "file",
            "file_url",
            "is_from_creator",
            "is_from_executor",
            "created_at",
        )
        read_only_fields = (
            "id",
            "task",
            "sender",
            "sender_name",
            "is_from_creator",
            "is_from_executor",
            "created_at",
            "file_url",
            "task_title",
        )

    def get_sender_name(self, obj: TaskMessage) -> str:
        return obj.sender_name

    def get_is_from_creator(self, obj: TaskMessage) -> bool:
        return obj.is_from_creator

    def get_is_from_executor(self, obj: TaskMessage) -> bool:
        return obj.is_from_executor

    def get_file_url(self, obj: TaskMessage) -> Optional[str]:
        if not obj.file:
            return None
        request = self.context.get("request")
        file_url = getattr(obj.file, "url", None)
        if not file_url:
            return None
        return request.build_absolute_uri(file_url) if request else file_url

    def create(self, validated_data):
        """
        task и sender будем передавать из view через .save(task=..., sender=...),
        чтобы их нельзя было подменить из запроса.
        """

        return TaskMessage.objects.create(**validated_data)


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

    creator_name = serializers.CharField(read_only=True)
    creator_position = serializers.CharField(read_only=True)
    assignee_name = serializers.CharField(read_only=True)
    assignee_position = serializers.CharField(read_only=True)

    result_file = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Task
        fields = (
            "id",
            "title",
            "description",
            "executor_comment",
            "priority",
            "priority_display",
            "status",
            "status_display",
            "due_at",
            "creator",
            "creator_name",
            "creator_position",
            "assignee",
            "assignee_name",
            "assignee_position",
            "created_at",
            "updated_at",
            "attachments",
            "result_file",
        )
        read_only_fields = (
            "id",
            "creator",
            "creator_name",
            "creator_position",
            "assignee_name",
            "assignee_position",
            "created_at",
            "updated_at",
        )

    def get_result_file(self, obj: Task) -> Optional[str]:
        return obj.last_result_file_url()
    def validate(self, attrs):
        assignee = attrs.get("assignee") or getattr(self.instance, "assignee", None)

        if assignee is not None:
            try:
                profile = assignee.telegram_profile
            except TelegramProfile.DoesNotExist:
                raise serializers.ValidationError(
                    {"assignee": "У исполнителя нет подключённого Telegram."}
                )

            if hasattr(profile, "is_confirmed") and not profile.is_confirmed:
                raise serializers.ValidationError(
                    {"assignee": "Telegram у исполнителя не подтверждён."}
                )

        return attrs


class TaskUpsertSerializer(serializers.ModelSerializer):
    """Сериализатор задачи для создания и изменения."""
    attachment = serializers.FileField(
        write_only=True,
        required=False,
        allow_null=True,
        help_text="Файл-вложение к задаче (от создателя).",
    )

    result_file = serializers.FileField(
        write_only=True,
        required=False,
        allow_null=True,
        help_text="Файл-результат выполнения задачи (от исполнителя).",
    )

    class Meta:
        model = Task
        fields = (
            "title",
            "description",
            "executor_comment",  # Добавил поле
            "priority",
            "status",
            "due_at",
            "assignee",
            "attachment",
            "result_file",
        )

    def create(self, validated_data: Dict[str, Any]) -> Task:
        """Создаёт задачу, проставляя создателя из текущего пользователя."""

        from .models import TaskAttachment  # чтобы избежать циклов импорта

        request = self.context.get("request")
        assert request is not None, "Request must be provided in serializer context"
        user: User = request.user

        attachment = validated_data.pop("attachment", None)
        result_file = validated_data.pop("result_file", None)

        task = Task.objects.create(creator=user, **validated_data)

        if attachment:
            TaskAttachment.objects.create(
                task=task,
                file=attachment,
                uploaded_by=user,
                kind=TaskAttachment.Kind.GENERAL,
            )

        if result_file:
            TaskAttachment.objects.create(
                task=task,
                file=result_file,
                uploaded_by=user,
                kind=TaskAttachment.Kind.RESULT,
            )

        return task

    def update(self, instance: Task, validated_data: Dict[str, Any]) -> Task:
        """Частичное обновление задачи + возможные новые вложения."""

        from .models import TaskAttachment

        request = self.context.get("request")
        assert request is not None, "Request must be provided in serializer context"
        user: User = request.user

        attachment = validated_data.pop("attachment", None)
        result_file = validated_data.pop("result_file", None)

        instance = super().update(instance, validated_data)

        if attachment:
            TaskAttachment.objects.create(
                task=instance,
                file=attachment,
                uploaded_by=user,
                kind=TaskAttachment.Kind.GENERAL,
            )

        if result_file:
            TaskAttachment.objects.create(
                task=instance,
                file=result_file,
                uploaded_by=user,
                kind=TaskAttachment.Kind.RESULT,
            )

        return instance


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
