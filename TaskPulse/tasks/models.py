"""models.py"""
import uuid
from typing import Optional
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone


User = get_user_model()


def task_attachment_upload_to(instance: "TaskAttachment", filename: str) -> str:
    """Возвращает путь, по которому будет сохранён файл вложения"""

    unique = uuid.uuid4()
    folder = f"{instance.task_id or 'pending'}"
    return f"task_attachments/{folder}/{unique}_{filename}"


class Task(models.Model):
    """Задача"""

    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"

    class Status(models.TextChoices):
        NEW = "new", "New"
        IN_PROGRESS = "in_progress", "In progress"
        DONE = "done", "Done"
        OVERDUE = "overdue", "Overdue"

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    priority = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.MEDIUM,
    )
    due_at = models.DateTimeField(null=True, blank=True)
    creator = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="created_tasks",
    )
    assignee = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_tasks",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.NEW,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        """Строковое представление задачи"""

        return f"[{self.get_priority_display()}] {self.title} ({self.get_status_display()})"

    def mark_overdue(self) -> None:
        """Помечает задачу просроченной, если дедлайн прошёл"""

        if self.due_at and timezone.now() > self.due_at and self.status != self.Status.DONE:
            old_status = self.status
            self.status = self.Status.OVERDUE
            self.save(update_fields=["status", "updated_at"])
            TaskChangeLog.log(
                task=self,
                field="status",
                old_value=old_status,
                new_value=self.status,
                reason="Автоматическая пометка просрочки",
            )

    def save(self, *args, **kwargs) -> None:
        """Переопределяем save, чтобы"""

        is_create = self.pk is None

        old: Optional["Task"] = None
        if not is_create:
            old = Task.objects.only("priority", "status", "due_at").get(pk=self.pk)

        super().save(*args, **kwargs)

        if old:
            if old.priority != self.priority:
                TaskChangeLog.log(
                    task=self,
                    field="priority",
                    old_value=old.priority,
                    new_value=self.priority,
                    reason="Изменение приоритета",
                )
            if old.status != self.status:
                TaskChangeLog.log(
                    task=self,
                    changed_by=None,
                    field="status",
                    old_value=old.status,
                    new_value=self.status,
                    reason="Изменение статуса",
                )
            if (old.due_at or None) != (self.due_at or None):
                TaskChangeLog.log(
                    task=self,
                    changed_by=None,
                    field="due_at",
                    old_value=old.due_at.isoformat() if old.due_at else None,
                    new_value=self.due_at.isoformat() if self.due_at else None,
                    reason="Изменение срока",
                )

    class Meta:
        """Метаданные модели Task"""

        verbose_name = "Task"
        verbose_name_plural = "Tasks"
        ordering = ("-updated_at",)
        indexes = [
            models.Index(fields=["assignee", "due_at"], name="idx_task_assignee_due"),
            models.Index(fields=["priority", "status"], name="idx_task_priority_status"),
            models.Index(fields=["due_at"], name="idx_task_due"),
        ]


class TaskAttachment(models.Model):
    """Вложение к задаче"""

    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="attachments",
    )
    file = models.FileField(upload_to=task_attachment_upload_to)
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="task_attachments",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        """Строковое представление вложения"""

    class Meta:
        """Метаданные вложения: сортировка свежие сначала"""

        ordering = ("-created_at",)


class TaskChangeLog(models.Model):
    """Журнал изменений задачи"""

    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="changes",
    )
    changed_at = models.DateTimeField(auto_now_add=True)
    changed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="task_changes",
    )
    field = models.CharField(max_length=50)
    old_value = models.TextField(null=True, blank=True)
    new_value = models.TextField(null=True, blank=True)
    reason = models.CharField(max_length=255, blank=True)

    def __str__(self) -> str:
        """Строковое представление записи журнала"""

    @classmethod
    def log(
        cls,
        task: Task,
        field: str,
        old_value: Optional[str],
        new_value: Optional[str],
        reason: str = "",
        changed_by: Optional[User] = None,
    ) -> "TaskChangeLog":
        """Фабричный метод для записи строки в журнал"""

        return cls.objects.create(
            task=task,
            changed_by=changed_by,
            field=field,
            old_value=old_value,
            new_value=new_value,
            reason=reason,
        )

    class Meta:
        """Метаданные журнала"""

        ordering = ("-changed_at",)
        indexes = [
            models.Index(fields=["task", "changed_at"], name="idx_task_changelog_task_time"),
        ]
