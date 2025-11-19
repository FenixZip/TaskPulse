"/d/PostgreSQL/18/bin/psql.exe" -U postgres -h localhost -p 5432 -d postgres -c "\l"
psql -U postgres -h localhost -p 5432 -d postgres -c "\l"

export PATH="/usr/bin:$PATH"

C:\Program Files\PostgreSQL\16\bin
Покрытие
pytest --cov=. --cov-report=term-missing

апусти psql:
psql -U postgres

CREATE DATABASE taskpulse;

# импортируем модели

from tasks.models import Task, TaskChangeLog
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

# возьмём любого пользователя (или создадим)

creator = User.objects.first()
assignee = creator # для теста назначим того же

# создадим задачу

t = Task.objects.create(
title="Сверстать карточку задачи",
description="Добавить приоритеты и сроки",
priority=Task.Priority.HIGH,
due_at=timezone.now() + timezone.timedelta(days=2),
creator=creator,
assignee=assignee,
)

# поменяем статус (триггернётся лог)

t.status = Task.Status.IN_PROGRESS
t.save()

# поменяем срок (триггернётся лог)

t.due_at = timezone.now() + timezone.timedelta(days=3)
t.save()

# посмотрим историю

list(TaskChangeLog.objects.filter(task=t).values("field","old_value","new_value","reason"))
