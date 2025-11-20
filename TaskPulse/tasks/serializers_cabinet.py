"""tasks/serializers_cabinet.py"""
from rest_framework import serializers

from .models import Task, TaskAttachment, TaskActionLog


class CreatorTaskListSerializer(serializers.ModelSerializer):
    """Короткая инфа по задаче для кабinетa Создателя."""

    assignee_name = serializers.CharField(
        source="assignee.full_name", read_only=True
    )

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "status",
            "priority",
            "due_at",
            "assignee",
            "assignee_name",
            "created_at",
            "updated_at",
        ]


class ExecutorTaskListSerializer(serializers.ModelSerializer):
    """Короткая инфа по задаче для кабинета Исполнителя."""

    creator_name = serializers.CharField(
        source="creator.full_name", read_only=True
    )

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "status",
            "priority",
            "due_at",
            "creator",
            "creator_name",
            "created_at",
            "updated_at",
        ]


class TaskAttachmentSerializer(serializers.ModelSerializer):
    """Вложения задачи (для истории во view Исполнителя)."""

    class Meta:
        model = TaskAttachment
        fields = ["id", "file", "created_at", "uploaded_by"]


class TaskActionLogSerializer(serializers.ModelSerializer):
    """Логи действий по задаче (для истории)."""

    actor_email = serializers.EmailField(
        source="actor.email", read_only=True
    )

    class Meta:
        model = TaskActionLog
        fields = [
            "id",
            "action",
            "field",
            "old_value",
            "new_value",
            "comment",
            "created_at",
            "actor",
            "actor_email",
        ]


class ExecutorTaskDetailSerializer(ExecutorTaskListSerializer):
    """Задача Исполнителя + история и вложения для «детальной» карточки."""

    attachments = TaskAttachmentSerializer(many=True, read_only=True)
    actions = TaskActionLogSerializer(many=True, read_only=True)

    class Meta(ExecutorTaskListSerializer.Meta):
        fields = ExecutorTaskListSerializer.Meta.fields + [
            "attachments",
            "actions",
        ]
