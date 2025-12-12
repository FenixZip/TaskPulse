# taskpulse/accounts/management/commands/seed_demo_tasks.py

import random
from datetime import timedelta

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models.signals import post_save

from tasks.models import Task


class Command(BaseCommand):
    help = "Создаёт демо-сотрудников и задачи под пользователя fenix15@inbox.ru"

    CREATOR_EMAIL = "fenix15@inbox.ru"
    DEMO_PREFIX = "[DEMO]"
    DEMO_EMAIL_DOMAIN = "example.com"

    # Человеческие статусы -> enum модели
    # (на случай, если где-то захочешь печатать/логировать)
    HUMAN_STATUS = {
        "NEW": "Новая",
        "OVERDUE": "Дедлайн нарушен",
        "DONE": "Выполнено",
    }

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Удалить старые DEMO-задачи перед созданием новых",
        )

    def handle(self, *args, **options):
        reset = options["reset"]
        User = get_user_model()

        try:
            creator = User.objects.get(email=self.CREATOR_EMAIL)
        except User.DoesNotExist:
            raise CommandError(f"User {self.CREATOR_EMAIL} not found")

        self.stdout.write(self.style.SUCCESS(
            f"Используем создателя: {creator.full_name} <{creator.email}>"
        ))
        self.stdout.write(f"Компания: {getattr(creator, 'company', None) or '— не указана —'}")

        if reset:
            deleted, _ = Task.objects.filter(
                creator=creator,
                title__startswith=self.DEMO_PREFIX
            ).delete()
            self.stdout.write(self.style.WARNING(f"Удалено DEMO-задач: {deleted}"))

        employees_data = [
            {"full_name": "Дарья Попова", "position": "Бухгалтер", "category": "finance"},
            {"full_name": "Николай Царевич", "position": "Супервизор", "category": "people_management"},
            {"full_name": "Маша Иванова", "position": "HR-менеджер", "category": "hr"},
            {"full_name": "Пётр Трактовский", "position": "Начальник охраны", "category": "security"},
            {"full_name": "Иван Смирнов", "position": "Маркетолог", "category": "marketing"},
            {"full_name": "Ольга Кузнецова", "position": "Юрист", "category": "legal"},
            {"full_name": "Сергей Петров", "position": "Логист", "category": "logistics"},
            {"full_name": "Анна Фролова", "position": "Проектный менеджер", "category": "projects"},
            {"full_name": "Егор Соколов", "position": "IT-специалист", "category": "it"},
            {"full_name": "Алексей Морозов", "position": "Финансовый аналитик", "category": "finance"},
            {"full_name": "Екатерина Лебедева", "position": "Специалист по закупкам", "category": "logistics"},
            {"full_name": "Дмитрий Орлов", "position": "Руководитель смены", "category": "people_management"},
            {"full_name": "Светлана Романова", "position": "Специалист по обучению персонала", "category": "hr"},
            {"full_name": "Виталий Киселёв", "position": "Инженер по безопасности", "category": "security"},
            {"full_name": "Татьяна Белова", "position": "Офис-менеджер", "category": "projects"},
            {"full_name": "Артём Захаров", "position": "Бизнес-аналитик", "category": "projects"},
        ]

        tasks_by_category = {
            "finance": [
                "Подготовить финансовый отчёт",
                "Проверить корректность платежей",
                "Проанализировать расходы",
                "Подготовить прогноз бюджета",
                "Проверить финансовые документы",
                "Сверить отчёт с банком",
                "Подготовить данные для руководства",
                "Проанализировать отклонения бюджета",
                "Проверить налоговые начисления",
                "Сформировать финансовую аналитику",
            ],
            "people_management": [
                "Контроль выполнения задач команды",
                "Провести собрание смены",
                "Оценить эффективность сотрудников",
                "Составить график работы",
                "Разобрать проблемные кейсы",
                "Провести 1:1 встречи",
                "Настроить мотивацию команды",
                "Проконтролировать дисциплину",
                "Сформировать отчёт по персоналу",
                "Проверить адаптацию новичков",
            ],
            "hr": [
                "Провести собеседование",
                "Подготовить онбординг",
                "Обновить кадровые документы",
                "Организовать обучение",
                "Провести оценку персонала",
                "Подготовить HR-отчёт",
                "Согласовать отпуск",
                "Проанализировать текучесть",
                "Подготовить оффер",
                "Обновить HR-политику",
            ],
            "security": [
                "Проверить систему безопасности",
                "Провести инструктаж",
                "Проверить журналы доступа",
                "Контроль видеонаблюдения",
                "Проверить тревожную сигнализацию",
                "Провести обход территории",
                "Подготовить отчёт по инцидентам",
                "Проверить посты охраны",
                "Обновить допуски",
                "Контроль СКУД",
            ],
            "marketing": [
                "Подготовить контент",
                "Проанализировать рекламу",
                "Подготовить отчёт по лидам",
                "Провести анализ конкурентов",
                "Обновить сайт",
                "Согласовать креативы",
                "Запустить рассылку",
                "Подготовить презентацию",
                "Проанализировать воронку",
                "Настроить кампанию",
            ],
            "legal": [
                "Проверить договор",
                "Подготовить правовое заключение",
                "Проконсультировать сотрудника",
                "Обновить реестр договоров",
                "Подготовить претензию",
                "Проверить документы",
                "Проанализировать риски",
                "Подготовить отчёт",
                "Проверить соответствие закону",
                "Согласовать изменения",
            ],
            "logistics": [
                "Составить график поставок",
                "Проверить складские остатки",
                "Оптимизировать маршрут",
                "Подготовить документы",
                "Проверить сроки доставки",
                "Контроль отгрузок",
                "Согласовать поставку",
                "Проверить возвраты",
                "Подготовить логистический отчёт",
                "Обновить данные в системе",
            ],
            "projects": [
                "Обновить план проекта",
                "Подготовить статус-отчёт",
                "Провести встречу",
                "Контроль сроков",
                "Согласовать изменения",
                "Обновить документацию",
                "Провести ретроспективу",
                "Оценить риски",
                "Подготовить презентацию",
                "Проверить загрузку команды",
            ],
            "it": [
                "Проверить систему",
                "Обновить ПО",
                "Настроить доступы",
                "Проверить логи",
                "Провести бэкап",
                "Оптимизировать БД",
                "Провести тестирование",
                "Настроить мониторинг",
                "Обработать тикеты",
                "Обновить документацию",
            ],
        }

        # Отключаем сигнал отправки email-верификации на время сидирования
        from accounts.signals import send_email_verification
        post_save.disconnect(send_email_verification, sender=User)

        try:
            employees = []
            for i, data in enumerate(employees_data, start=1):
                email = f"demo_employee_{i}@{self.DEMO_EMAIL_DOMAIN}"

                user, created = User.objects.get_or_create(
                    email=email,
                    defaults={
                        "full_name": data["full_name"],
                        "position": data["position"],
                        "company": getattr(creator, "company", None),
                        "role": User.Role.EXECUTOR,
                        "is_active": True,
                    },
                )

                # если уже существовал — обновим данные под демо-список
                changed = False
                if getattr(user, "full_name", None) != data["full_name"]:
                    user.full_name = data["full_name"]
                    changed = True
                if getattr(user, "position", None) != data["position"]:
                    user.position = data["position"]
                    changed = True
                if getattr(user, "company", None) != getattr(creator, "company", None):
                    user.company = getattr(creator, "company", None)
                    changed = True
                if changed:
                    user.save()

                if created:
                    user.set_password("Demo12345!")
                    user.save(update_fields=["password"])

                user._category = data["category"]
                employees.append(user)

        finally:
            post_save.connect(send_email_verification, sender=User)

        # === задачи со статусами: Новая / Дедлайн нарушен / Выполнено ===

        now = timezone.now()

        # Статусы модели (enum)
        STATUS_NEW = Task.Status.NEW
        STATUS_OVERDUE = Task.Status.OVERDUE
        STATUS_DONE = Task.Status.DONE

        statuses = [STATUS_NEW, STATUS_OVERDUE, STATUS_DONE]

        for user in employees:
            titles = tasks_by_category[user._category]

            for i in range(10):
                status = random.choice(statuses)

                if status == STATUS_NEW:
                    # новая: дедлайн в будущем
                    due_at = now + timedelta(days=random.randint(1, 14))
                elif status == STATUS_OVERDUE:
                    # дедлайн нарушен: дедлайн в прошлом
                    due_at = now - timedelta(days=random.randint(1, 14))
                else:
                    # выполнено: можно сделать дедлайн в прошлом или рядом с текущей датой
                    # (это влияет только на отображение, статус всё равно "выполнено")
                    due_at = now + timedelta(days=random.randint(-7, 7))

                Task.objects.create(
                    title=f"{self.DEMO_PREFIX} {titles[i % len(titles)]}",
                    description=f"Демо-задача для {user.full_name}",
                    priority=random.choice([Task.Priority.LOW, Task.Priority.MEDIUM, Task.Priority.HIGH]),
                    status=status,
                    due_at=due_at,
                    creator=creator,
                    assignee=user,
                )

        self.stdout.write(self.style.SUCCESS(
            f"Готово! Создано {len(employees)} сотрудников и {len(employees) * 10} задач."
        ))
