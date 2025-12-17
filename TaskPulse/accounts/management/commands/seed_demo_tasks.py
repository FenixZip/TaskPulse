# taskpulse/accounts/management/commands/seed_demo_tasks.py

import random
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db.models.signals import post_save
from django.utils import timezone

from tasks.models import Task


class Command(BaseCommand):
    help = "Создаёт 10–15 демо-пользователей, каждому по 8 задач, всем назначает Telegram ID"

    CREATOR_EMAIL = "fenix15@inbox.ru"
    DEMO_PREFIX = "[DEMO]"
    DEMO_EMAIL_DOMAIN = "example.com"
    DEMO_PASSWORD = "Demo12345!"

    TELEGRAM_ID_START = 7000000000  # безопасный диапазон

    def add_arguments(self, parser):
        parser.add_argument("--reset", action="store_true")
        parser.add_argument("--people", type=int, default=12)

    def attach_telegram(self, user, telegram_id: int):
        """
        Безопасно создаёт TelegramProfile для пользователя
        """
        try:
            from integrations.telegram.models import TelegramProfile
        except Exception:
            return  # интеграции нет — просто пропускаем

        profile, _ = TelegramProfile.objects.get_or_create(user=user)

        if hasattr(profile, "telegram_user_id"):
            profile.telegram_user_id = telegram_id
        if hasattr(profile, "chat_id"):
            profile.chat_id = telegram_id

        profile.save()

    def handle(self, *args, **options):
        people = options["people"]
        reset = options["reset"]

        if not 10 <= people <= 15:
            raise CommandError("--people должен быть в диапазоне 10–15")

        User = get_user_model()

        try:
            creator = User.objects.get(email=self.CREATOR_EMAIL)
        except User.DoesNotExist:
            raise CommandError(f"Создатель {self.CREATOR_EMAIL} не найден")

        if reset:
            Task.objects.filter(
                creator=creator,
                title__startswith=self.DEMO_PREFIX
            ).delete()

        from accounts.signals import send_email_verification
        post_save.disconnect(send_email_verification, sender=User)

        employees_data = [
            ("Дарья Попова", "Бухгалтер"),
            ("Николай Царевич", "Супервизор"),
            ("Маша Иванова", "HR-менеджер"),
            ("Пётр Трактовский", "Начальник охраны"),
            ("Иван Смирнов", "Маркетолог"),
            ("Ольга Кузнецова", "Юрист"),
            ("Сергей Петров", "Логист"),
            ("Анна Фролова", "Проектный менеджер"),
            ("Егор Соколов", "IT-специалист"),
            ("Алексей Морозов", "Финансовый аналитик"),
            ("Екатерина Лебедева", "Специалист по закупкам"),
            ("Дмитрий Орлов", "Руководитель смены"),
            ("Светлана Романова", "Специалист по обучению"),
            ("Виталий Киселёв", "Инженер по безопасности"),
            ("Татьяна Белова", "Офис-менеджер"),
        ][:people]

        employees = []

        try:
            for i, (name, position) in enumerate(employees_data, start=1):
                email = f"demo_employee_{i}@{self.DEMO_EMAIL_DOMAIN}"

                user, created = User.objects.get_or_create(
                    email=email,
                    defaults={
                        "full_name": name,
                        "position": position,
                        "company": creator.company,
                        "role": User.Role.EXECUTOR,
                        "is_active": True,
                    },
                )

                if created:
                    user.set_password(self.DEMO_PASSWORD)
                    user.save()

                telegram_id = self.TELEGRAM_ID_START + i
                self.attach_telegram(user, telegram_id)

                employees.append(user)

        finally:
            post_save.connect(send_email_verification, sender=User)

        now = timezone.now()
        statuses = [Task.Status.NEW, Task.Status.OVERDUE, Task.Status.DONE]

        task_titles = [
            "Подготовить отчёт",
            "Согласовать план работ",
            "Проверить входящие задачи",
            "Обновить документацию",
            "Провести встречу",
            "Собрать статусы",
            "Разобрать блокеры",
            "Подготовить презентацию",
        ]

        total_tasks = 0

        for user in employees:
            for i in range(8):
                status = random.choice(statuses)

                if status == Task.Status.NEW:
                    due_at = now + timedelta(days=random.randint(1, 14))
                elif status == Task.Status.OVERDUE:
                    due_at = now - timedelta(days=random.randint(1, 14))
                else:
                    due_at = now + timedelta(days=random.randint(-7, 7))

                Task.objects.create(
                    title=f"{self.DEMO_PREFIX} {task_titles[i]}",
                    description=f"Демо-задача для {user.full_name}",
                    priority=random.choice(
                        [Task.Priority.LOW, Task.Priority.MEDIUM, Task.Priority.HIGH]
                    ),
                    status=status,
                    due_at=due_at,
                    creator=creator,
                    assignee=user,
                )
                total_tasks += 1

        self.stdout.write(self.style.SUCCESS(
            f"Готово: {len(employees)} пользователей, {total_tasks} задач. "
            f"Telegram ID назначен всем."
        ))
