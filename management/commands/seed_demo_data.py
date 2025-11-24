from datetime import timedelta

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone

from tasks.models import Task


class Command(BaseCommand):
    help = "Создаёт демо-данные: 1 создатель, 10 исполнителей и задачи для них"

    def handle(self, *args, **options):
        User = get_user_model()

        demo_password = "Test1234!"  # общий пароль для демо

        # 1. Создатель
        creator_email = "creator@example.com"
        creator, created = User.objects.get_or_create(
            email=creator_email,
            defaults={
                "full_name": "Demo Creator",
                "company": "Demo Company",
                "position": "Руководитель",
                "role": User.Role.CREATOR,
                "email_verified": True,
            },
        )
        if created:
            creator.set_password(demo_password)
            creator.save()
            self.stdout.write(self.style.SUCCESS(
                f"Создан Создатель: {creator_email} / {demo_password}"
            ))
        else:
            self.stdout.write(self.style.WARNING(
                f"Создатель уже существует: {creator_email}"
            ))

        # 2. Исполнители
        executors = []

        for i in range(1, 11):
            email = f"executor{i}@example.com"
            full_name = f"Исполнитель {i}"

            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    "full_name": full_name,
                    "company": creator.company,
                    "position": "Сотрудник",
                    "role": User.Role.EXECUTOR,
                    "email_verified": True,
                },
            )
            if created:
                user.set_password(demo_password)
                user.save()
                self.stdout.write(self.style.SUCCESS(
                    f"Создан Исполнитель: {email} / {demo_password}"
                ))
            else:
                self.stdout.write(self.style.WARNING(
                    f"Исполнитель уже существует: {email}"
                ))

            executors.append(user)

        # 3. Задачи для каждого исполнителя
        # Если хочешь каждый раз всё очищать - оставь эту строку.
        # Если не хочешь терять старые задачи - закомментируй.
        # Task.objects.all().delete()

        now = timezone.now()
        priorities = [
            Task.Priority.HIGH,
            Task.Priority.MEDIUM,
            Task.Priority.LOW,
        ]
        statuses = [
            Task.Status.NEW,
            Task.Status.IN_PROGRESS,
            Task.Status.DONE,
        ]

        for idx, executor in enumerate(executors, start=1):
            for j in range(3):  # по 3 задачи на исполнителя
                priority = priorities[j % len(priorities)]
                status = statuses[(idx + j) % len(statuses)]

                task = Task.objects.create(
                    title=f"Задача {idx}-{j+1} для {executor.full_name}",
                    description=f"Описание задачи {idx}-{j+1}",
                    priority=priority,
                    status=status,
                    creator=creator,
                    assignee=executor,
                    due_at=now + timedelta(days=idx + j),
                )
                self.stdout.write(self.style.SUCCESS(
                    f"Создана задача: {task.title} (приоритет {priority}, статус {status})"
                ))

        self.stdout.write(self.style.SUCCESS("✅ Демо-данные успешно созданы."))
        self.stdout.write("")
        self.stdout.write("===== Доступы для входа =====")
        self.stdout.write(f"Создатель: {creator_email} / {demo_password}")
        for i in range(1, 11):
            self.stdout.write(f"Исполнитель {i}: executor{i}@example.com / {demo_password}")
