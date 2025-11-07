from django.apps import AppConfig

class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "accounts"

    def ready(self):
        from . import signals  # noqa: F401

    from django.core.mail.utils import DNS_NAME  # noqa
    DNS_NAME._fqdn = "task-pulse.local"
