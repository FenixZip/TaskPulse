"""admin.py"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import EmailVerificationToken, Invitation, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Управляем формами создания/редактирования и списком полей."""

    fieldsets = (
        (None, {"fields": ("email", "password", "role", "email_verified")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = ((None, {"fields": ("email", "password1", "password2", "role")}),)
    list_display = ("email", "role", "is_active", "email_verified")
    search_fields = ("email",)
    ordering = ("email",)


admin.site.register(Invitation)
admin.site.register(EmailVerificationToken)
