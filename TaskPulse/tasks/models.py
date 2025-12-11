"""tasks/models.py"""

import uuid
from datetime import datetime
from typing import Optional

from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone

User = get_user_model()


def task_attachment_upload_to(instance: "TaskAttachment", filename: str) -> str:
    """Возвращает путь, по которому будет сохранён файл вложения."""

    unique = uuid.uuid4()
    folder = f"{instance.task_id or 'pending'}"
    return f"task_attachments/{folder}/{unique}_{filename}"


def task_message_upload_to(instance, filename):
    """Путь для файлов, прикреплённых в чате по задаче."""

    folder = f"{instance.task_id or 'pending'}"
    unique = uuid.uuid4()
    return f"task_messages/{folder}/{unique}_{filename}"


class Task(models.Model):
    """Модель задачи."""

    class Priority(models.TextChoices):
        """Уровень приоритета задачи."""

        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"

    class Status(models.TextChoices):
        """Статус выполнения задачи."""

        NEW = "new", "New"
        IN_PROGRESS = "in_progress", "In progress"
        DONE = "done", "Done"
        OVERDUE = "overdue", "Overdue"

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    executor_comment = models.TextField(blank=True)
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
    reminder_sent_at = models.DateTimeField(null=True, blank=True)

    def __str__(self) -> str:
        """Возвращает человеко-читаемое строковое представление задачи."""

        return f"[{self.get_priority_display()}] {self.title} ({self.get_status_display()})"

    def mark_overdue(self) -> bool:
        """Помечает задачу просроченной, если дедлайн прошёл."""

        if (
                self.due_at
                and timezone.now() > self.due_at
                and self.status != self.Status.DONE
        ):
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
            return True
        return False

    def save(self, *args, **kwargs) -> None:
        """Сохраняет задачу и при необходимости логирует изменения."""

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
        """Метаданные модели Task."""

        verbose_name = "Task"
        verbose_name_plural = "Tasks"
        ordering = ("-updated_at",)
        indexes = [
            models.Index(fields=["assignee", "due_at"], name="idx_task_assignee_due"),
            models.Index(
                fields=["priority", "status"], name="idx_task_priority_status"
            ),
            models.Index(fields=["due_at"], name="idx_task_due"),
        ]

    @property
    def creator_name(self) -> str:
        """Удобное поле для ФИО создателя задачи."""
        return self.creator.full_name or self.creator.email

    @property
    def creator_position(self) -> str:
        """Должность создателя задачи."""
        return self.creator.position or ""

    @property
    def assignee_name(self) -> str:
        """Удобное поле для ФИО исполнителя задачи."""
        if self.assignee_id and self.assignee:
            return self.assignee.full_name or self.assignee.email
        return ""

    @property
    def assignee_position(self) -> str:
        """Должность исполнителя задачи."""
        if self.assignee_id and self.assignee:
            return self.assignee.position or ""
        return ""

    def last_result_file_url(self) -> Optional[str]:
        """
        URL последнего файла-результата от исполнителя,
        если такой есть.
        """
        result = (
            self.attachments
            .filter(kind=TaskAttachment.Kind.RESULT)
            .order_by("-created_at")
            .first()
        )
        if result and result.file:
            try:
                return result.file.url
            except ValueError:
                return None
        return None


class TaskAttachment(models.Model):
    """Вложение к задаче."""

    class Kind(models.TextChoices):
        GENERAL = "general", "Общее вложение"
        RESULT = "result", "Результат выполнения"

    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="attachments",
    )

    file = models.FileField(upload_to=task_attachment_upload_to)
    kind = models.CharField(
        max_length=20,
        choices=Kind.choices,
        default=Kind.GENERAL,
    )
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="task_attachments",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        """Возвращает строковое представление вложения."""

        filename = self.file.name.split("/")[-1] if self.file else "no-file"
        return f"Attachment #{self.pk} for task {self.task_id}: {filename}"

    class Meta:
        """Метаданные модели вложения."""

        ordering = ("-created_at",)


class TaskChangeLog(models.Model):
    """Журнал изменений задачи."""

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
        """Возвращает строковое представление записи журнала."""

        return f"Change[{self.field}] for task {self.task_id} at {self.changed_at}"

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
        """Создаёт и сохраняет запись в журнале изменений задачи."""

        return cls.objects.create(
            task=task,
            changed_by=changed_by,
            field=field,
            old_value=old_value,
            new_value=new_value,
            reason=reason,
        )

    class Meta:
        """Метаданные модели журнала изменений."""

        ordering = ("-changed_at",)
        indexes = [
            models.Index(
                fields=["task", "changed_at"], name="idx_task_changelog_task_time"
            ),
        ]


class TaskActionLog(models.Model):
    """Класс журнала действий над задачами"""

    class Action(models.TextChoices):
        """
        Вложенный класс с перечислением возможных типов действий
        действие: исполнитель подтвердил, что выполнит задачу вовремя
        """

        CONFIRM_ON_TIME = "confirm_on_time", "Подтверждение выполнения в срок"
        # действие: дедлайн задачи продлён на 1 день
        EXTEND_DUE_1D = "extend_due_1d", "Продление дедлайна на 1 день"
        # действие: произвольный комментарий по задаче
        COMMENT = "comment", "Комментарий"
        # действие: любое другое действие, если не подошло ни одно из вышеперечисленных
        OTHER = "other", "Другое действие"

    # ссылка на задачу, к которой относится действие
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="actions",
    )

    # пользователь, который совершил действие (может быть NULL для системных действий)
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="task_actions",
    )

    # тип действия (одно из значений перечисления Action выше)
    action = models.CharField(
        max_length=50,
        choices=Action.choices,
    )

    # текстовый комментарий к действию
    comment = models.TextField(
        blank=True,
    )

    # предыдущий дедлайн задачи (если действие связано с переносом срока)
    old_due_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    # новый дедлайн задачи (после действия)
    new_due_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    # когда действие было совершено (автоматически заполняется текущим временем)
    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        """Возвращает человеко-читаемое строковое представление действия."""

        user_email = self.user.email if self.user else "system"
        return f"Action[{self.action}] for task {self.task_id} by {user_email}"

    @classmethod
    def log_action(
            cls,
            *,
            task: Task,
            action: str,
            user: Optional[User] = None,
            comment: str = "",
            old_due_at: Optional[datetime] = None,
            new_due_at: Optional[datetime] = None,
    ) -> "TaskActionLog":
        """Удобный класс-метод для записи действия в журнал."""

        # создаём и сразу сохраняем объект в базе через менеджер objects.create(...)
        return cls.objects.create(
            task=task,
            user=user,
            action=action,
            comment=comment,
            old_due_at=old_due_at,
            new_due_at=new_due_at,
        )

    class Meta:
        """Метаданные модели журнала действий."""

        # по умолчанию сортируем по дате создания, от новых к старым
        ordering = ("-created_at",)
        # добавляем индексы для ускорения запросов по задаче, дате и типу действия
        indexes = [
            # индекс по задаче и времени — удобно для выборки всех действий по задаче
            models.Index(
                fields=["task", "created_at"], name="idx_task_actionlog_task_time"
            ),
            # индекс по пользователю и дате — удобно для отчётов по активности пользователя
            models.Index(
                fields=["user", "created_at"], name="idx_task_actionlog_user_time"
            ),
            # индекс по типу действия — удобно для агрегирования по action
            models.Index(fields=["action"], name="idx_task_actionlog_action"),
        ]


class TaskMessage(models.Model):
    """Сообщение в чате по задаче (Создатель ↔ Исполнитель)."""

    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="task_messages",
    )
    text = models.TextField(blank=True)

    file = models.FileField(
        upload_to=task_message_upload_to,
        blank=True,
        null=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("created_at",)

    def __str__(self) -> str:
        return f"Message #{self.pk} for task {self.task_id} from {self.sender_id}"

    @property
    def sender_name(self) -> str:
        return self.sender.full_name or self.sender.email

    @property
    def is_from_creator(self) -> bool:
        return self.sender_id == self.task.creator_id

    @property
    def is_from_executor(self) -> bool:
        return self.sender_id == self.task.assignee_id
