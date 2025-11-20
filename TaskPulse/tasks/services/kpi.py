"""tasks/services/kpi.py"""
"""Сервисные функции для расчёта KPI по задачам."""
from typing import Dict, Any, List

from django.db.models import F, Q

from tasks.models import Task
from accounts.models import User


def calc_user_month_kpi(user: User, year: int, month: int) -> Dict[str, Any]:
    """
    Считает KPI по задачам пользователя за указанный месяц.
    Метрики:
    - total            — всего задач с due_at в этом месяце;
    - done             — сколько из них выполнено (status=DONE);
    - done_on_time     — выполнено в срок (updated_at <= due_at или due_at is null);
    - done_late        — выполнено, но позже срока;
    - by_priority[]    — те же показатели по каждому priority.
    """

    # Берём задачи, у которых due_at попадает в нужный месяц
    base_qs = Task.objects.filter(
        assignee=user,
        due_at__year=year,
        due_at__month=month,
    )

    total = base_qs.count()
    done_qs = base_qs.filter(status=Task.Status.DONE)
    done = done_qs.count()

    done_on_time_qs = done_qs.filter(
        Q(due_at__isnull=True) | Q(updated_at__lte=F("due_at"))
    )
    done_on_time = done_on_time_qs.count()
    done_late = max(done - done_on_time, 0)

    by_priority: List[Dict[str, Any]] = []
    for priority_value, _label in Task.Priority.choices:
        p_qs = base_qs.filter(priority=priority_value)
        p_total = p_qs.count()
        p_done_qs = p_qs.filter(status=Task.Status.DONE)
        p_done = p_done_qs.count()
        p_done_on_time = p_done_qs.filter(
            Q(due_at__isnull=True) | Q(updated_at__lte=F("due_at"))
        ).count()
        p_done_late = max(p_done - p_done_on_time, 0)

        by_priority.append(
            {
                "priority": priority_value,
                "total": p_total,
                "done": p_done,
                "done_on_time": p_done_on_time,
                "done_late": p_done_late,
            }
        )

    return {
        "user_id": user.id,
        "month": f"{year:04d}-{month:02d}",
        "total": total,
        "done": done,
        "done_on_time": done_on_time,
        "done_late": done_late,
        "by_priority": by_priority,
    }
