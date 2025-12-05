"""tasks/admin.py"""

from django.contrib import admin

from .models import Task, TaskAttachment, TaskChangeLog, TaskMessage


class TaskAttachmentInline(admin.TabularInline):
    """Inline-представление вложений задачи на странице редактирования Task.
    Позволяет просматривать и добавлять вложения непосредственно из формы задачи.
    """

    model = TaskAttachment
    extra = 0


class TaskChangeLogInline(admin.TabularInline):
    """Inline-представление журнала изменений задачи на странице Task.
    Журнал изменений отображается в табличном виде и доступен только для чтения:
    все поля помечены как `readonly_fields`, чтобы предотвратить правки руками
    через админку. Создание записей журнала предполагается из бизнес-логики
    приложения, а не вручную через интерфейс администратора.
    """

    model = TaskChangeLog
    extra = 0
    readonly_fields = (
        "changed_at",
        "changed_by",
        "field",
        "old_value",
        "new_value",
        "reason",
    )


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    """Админ-конфигурация для модели Task (задача).
    Основные настройки:
    - list_display — столбцы, отображаемые в списке задач;
    - list_filter — фильтры по приоритету, статусу и исполнителю;
    - search_fields — поиск по названию и описанию;
    - inlines — связанные модели (вложения и история изменений),
      отображаемые на странице детали задачи.
    """

    list_display = (
        "id",
        "title",
        "priority",
        "status",
        "assignee",
        "due_at",
        "updated_at",
    )
    list_filter = ("priority", "status", "assignee")
    search_fields = ("title", "description")
    inlines = [TaskAttachmentInline, TaskChangeLogInline]


@admin.register(TaskAttachment)
class TaskAttachmentAdmin(admin.ModelAdmin):
    """Админ-конфигурация для модели TaskAttachment (вложение к задаче).
    В списке вложений отображаются:
    - id — идентификатор вложения;
    - task — связанная задача;
    - uploaded_by — пользователь, загрузивший вложение;
    - created_at — дата и время загрузки.
    """

    list_display = ("id", "task", "uploaded_by", "created_at")


@admin.register(TaskChangeLog)
class TaskChangeLogAdmin(admin.ModelAdmin):
    """Админ-конфигурация для модели TaskChangeLog (журнал изменений задачи).
    Основные настройки:
    - list_display — ключевые поля журнала для списка записей;
    - list_filter — фильтрация по полю `field` и пользователю `changed_by`;
    - search_fields — поиск по старому и новому значению, а также по причине изменения;
    - readonly_fields — все поля доступны только для чтения, чтобы журнал
      изменений не редактировался руками через админку.
    """

    list_display = ("id", "task", "field", "changed_by", "changed_at")
    list_filter = ("field", "changed_by")
    search_fields = ("old_value", "new_value", "reason")
    readonly_fields = (
        "task",
        "changed_at",
        "changed_by",
        "field",
        "old_value",
        "new_value",
        "reason",
    )


@admin.register(TaskMessage)
class TaskMessageAdmin(admin.ModelAdmin):
    list_display = ("id", "task", "sender", "created_at")
    search_fields = ("text",)
    list_filter = ("task", "sender")