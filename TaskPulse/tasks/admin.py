"""admin.py"""
from django.contrib import admin
from .models import Task, TaskAttachment, TaskChangeLog


class TaskAttachmentInline(admin.TabularInline):
    model = TaskAttachment
    extra = 0


class TaskChangeLogInline(admin.TabularInline):
    model = TaskChangeLog
    extra = 0
    readonly_fields = ("changed_at", "changed_by", "field", "old_value", "new_value", "reason")


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "priority", "status", "assignee", "due_at", "updated_at")
    list_filter = ("priority", "status", "assignee")
    search_fields = ("title", "description")
    inlines = [TaskAttachmentInline, TaskChangeLogInline]


@admin.register(TaskAttachment)
class TaskAttachmentAdmin(admin.ModelAdmin):
    list_display = ("id", "task", "uploaded_by", "created_at")


@admin.register(TaskChangeLog)
class TaskChangeLogAdmin(admin.ModelAdmin):
    list_display = ("id", "task", "field", "changed_by", "changed_at")
    list_filter = ("field", "changed_by")
    search_fields = ("old_value", "new_value", "reason")
    readonly_fields = ("task", "changed_at", "changed_by", "field", "old_value", "new_value", "reason")
