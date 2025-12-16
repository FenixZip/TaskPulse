# taskpulse/accounts/management/commands/one_tasks.py

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db.models.signals import post_save
from django.utils import timezone

from tasks.models import Task


class Command(BaseCommand):
    help = "Удаляет ВСЕ задачи и создаёт 1 демо-пользователя (EXECUTOR) и 1 задачу для него."

    CREATOR_EMAIL = "fenix15@inbox.ru"

    DEMO_USER_EMAIL = "demo_employee_1@example.com"
    DEMO_PASSWORD = "Demo12345!"
    DEMO_FULL_NAME = "Демо Исполнитель"
    DEMO_POSITION = "Исполнитель"

    TELEGRAM_ID = 7000000001

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset-user",
            action="store_true",
            help="Дополнительно удалить демо-пользователя перед созданием",
        )

    def attach_telegram(self, user, telegram_id: int) -> None:
        try:
            from integrations.telegram.models import TelegramProfile
        except Exception:
            return

        profile, _ = TelegramProfile.objects.get_or_create(user=user)
        if hasattr(profile, "telegram_user_id"):
            profile.telegram_user_id = telegram_id
        if hasattr(profile, "chat_id"):
            profile.chat_id = telegram_id
        profile.save()

    def handle(self, *args, **options):
        reset_user = options["reset_user"]
        User = get_user_model()

        try:
            creator = User.objects.get(email=self.CREATOR_EMAIL)
        except User.DoesNotExist:
            raise CommandError(f"Создатель (creator) с email={self.CREATOR_EMAIL} не найден")

        # отключаем email-сигналы на время сидирования (если есть)
        try:
            from accounts.signals import send_email_verification
            post_save.disconnect(send_email_verification, sender=User)
            signals_were_touched = True
        except Exception:
            send_email_verification = None
            signals_were_touched = False

        try:
            # --- УДАЛЯЕМ ВСЕ ЗАДАЧИ ---
            deleted_count, _ = Task.objects.all().delete()

            # --- при необходимости пересоздаём демо-пользователя ---
            if reset_user:
                User.objects.filter(email=self.DEMO_USER_EMAIL).delete()

            # --- создаём/получаем демо-пользователя ---
            demo_user, user_created = User.objects.get_or_create(
                email=self.DEMO_USER_EMAIL,
                defaults={
                    "full_name": self.DEMO_FULL_NAME,
                    "position": self.DEMO_POSITION,
                    "company": creator.company,
                    "role": User.Role.EXECUTOR,
                    "is_active": True,
                },
            )

            if user_created:
                demo_user.set_password(self.DEMO_PASSWORD)
                demo_user.save()

            self.attach_telegram(demo_user, self.TELEGRAM_ID)

            # --- создаём ровно 1 задачу ---
            now = timezone.now()
            task = Task.objects.create(
                creator=creator,
                assignee=demo_user,
                title="[DEMO] Подготовить отчёт",
                description=f"Единственная демо-задача для {demo_user.full_name}",
                priority=Task.Priority.MEDIUM,
                status=Task.Status.NEW,
                due_at=now + timedelta(days=7),
            )

        finally:
            if signals_were_touched and send_email_verification is not None:
                post_save.connect(send_email_verification, sender=User)

        self.stdout.write(self.style.SUCCESS(
            "Готово: все задачи удалены, создана 1 задача.\n"
            f"Удалено задач (и связанных объектов через каскад): {deleted_count}\n"
            f"User: {'created' if user_created else 'exists'} ({demo_user.email})\n"
            f"Task: created (id={task.id}, title={task.title})"
        ))
