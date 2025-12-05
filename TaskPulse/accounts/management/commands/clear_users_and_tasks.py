from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import User
from tasks.models import Task


class Command(BaseCommand):
    help = (
        "Очистить базу от всех задач и всех пользователей, "
        "кроме суперпользователей."
    )

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("ВНИМАНИЕ!"))
        self.stdout.write(
            "Будут удалены:\n"
            "- все задачи (tasks_task)\n"
            "- все пользователи, кроме суперпользователей\n"
        )

        confirm = input("Продолжить? (yes/no): ").strip().lower()
        if confirm not in ("yes", "y"):
            self.stdout.write(self.style.NOTICE("Отменено."))
            return

        with transaction.atomic():
            # Сначала удаляем задачи, чтобы не ломать FK на пользователей
            tasks_deleted, _ = Task.objects.all().delete()

            # Потом удаляем всех НЕ-суперпользователей
            users_qs = User.objects.filter(is_superuser=False)
            users_deleted, _ = users_qs.delete()

        self.stdout.write(
            self.style.SUCCESS(
                f"Готово. Удалено задач: {tasks_deleted}, "
                f"пользователей: {users_deleted}."
            )
        )
