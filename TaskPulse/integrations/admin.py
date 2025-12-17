"""integrations/admin.py"""

from django.contrib import admin

from .models import TelegramProfile, TelegramUpdate, TelegramLinkToken


@admin.register(TelegramProfile)
class TelegramProfileAdmin(admin.ModelAdmin):
    """Настройки отображения TelegramProfile в админке."""

    list_display = (
        "id",
        "user",
        "telegram_user_id",
        "chat_id",
        "created_at",
        "last_activity_at",
    )
    search_fields = ("user__email", "telegram_user_id")
    list_filter = ("created_at",)
    ordering = ("-created_at",)


@admin.register(TelegramUpdate)
class TelegramUpdateAdmin(admin.ModelAdmin):
    """Лог уже обработанных Telegram update_id."""

    list_display = ("id", "update_id", "processed_at")
    search_fields = ("update_id",)
    ordering = ("-processed_at",)


@admin.register(TelegramLinkToken)
class TelegramLinkTokenAdmin(admin.ModelAdmin):
    """
    Одноразовые токены привязки Telegram к аккаунту.
    Используются при /start <token>.
    """

    list_display = ("id", "user", "token", "is_used", "created_at")
    search_fields = ("user__email", "token")
    list_filter = ("is_used", "created_at")
    ordering = ("-created_at",)
