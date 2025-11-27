"""tests/test_tasks_reminders.py"""
import pytest
from datetime import timedelta

from django.utils import timezone

from tasks.models import Task
from tasks.tasks_reminders import (
    send_task_assigned_notification,
    send_due_soon_reminders,
)


@pytest.mark.django_db
def test_send_task_assigned_notification_calls_notify_for_existing_task(
        task_factory, monkeypatch
):
    """
    Цель: send_task_assigned_notification должен вызвать notify_task_assigned,
    если задача с таким id существует.
    """

    task = task_factory()

    called = {"task_id": None}

    def fake_notify(t):
        called["task_id"] = t.id

    # подменяем notify_task_assigned внутри модуля tasks_reminders
    monkeypatch.setattr(
        "tasks.tasks_reminders.notify_task_assigned",
        fake_notify,
    )

    # вызываем таск как обычную функцию (CELERY_TASK_ALWAYS_EAGER=True, но нам это не важно)
    send_task_assigned_notification(task.id)

    assert called["task_id"] == task.id


@pytest.mark.django_db
def test_send_task_assigned_notification_ignores_missing_task(monkeypatch):
    """
    Цель: если задачи с таким id нет — функция должна отработать без исключения
    и не вызвать notify_task_assigned.
    """

    called = {"flag": False}

    def fake_notify(t):
        called["flag"] = True

    monkeypatch.setattr(
        "tasks.tasks_reminders.notify_task_assigned",
        fake_notify,
    )

    # заведомо несуществующий id
    send_task_assigned_notification(999999)

    assert called["flag"] is False


# ───────────────── send_due_soon_reminders ─────────────────


@pytest.mark.django_db
def test_send_due_soon_reminders_selects_only_tasks_in_window(
        creator, executor, monkeypatch
):
    """
    Цель: send_due_soon_reminders:
    - выбирает только задачи с due_at в окне [now+24h; now+24h+15m];
    - вызывает notify_task_due_soon только для них;
    - помечает их как 'reminder_sent_at', чтобы второй запуск не дублировал уведомления.

    Ожидаем: в первом запуске вызывается 1 раз; во втором — 0 раз.
    """

    fixed_now = timezone.now()

    # фиксим "текущее время" внутри tasks_reminders
    monkeypatch.setattr(
        "tasks.tasks_reminders.timezone",
        type(
            "TZStub",
            (),
            {"now": staticmethod(lambda: fixed_now)},
        ),
    )

    # список вызванных task_id
    called_ids = []

    def fake_notify_due_soon(task):
        called_ids.append(task.id)

    monkeypatch.setattr(
        "tasks.tasks_reminders.notify_task_due_soon",
        fake_notify_due_soon,
    )

    # ── создаём задачи ──
    # в окне: +24ч+5м — должна попасть
    in_window = Task.objects.create(
        title="In window",
        description="",
        priority=Task.Priority.MEDIUM,
        status=Task.Status.NEW,
        creator=creator,
        assignee=executor,
        due_at=fixed_now + timedelta(hours=24, minutes=5),
    )

    # раньше 24ч — НЕ должна попасть
    Task.objects.create(
        title="Too early",
        description="",
        priority=Task.Priority.MEDIUM,
        status=Task.Status.NEW,
        creator=creator,
        assignee=executor,
        due_at=fixed_now + timedelta(hours=23),
    )

    # позже 24ч+15м — НЕ должна попасть
    Task.objects.create(
        title="Too late",
        description="",
        priority=Task.Priority.MEDIUM,
        status=Task.Status.NEW,
        creator=creator,
        assignee=executor,
        due_at=fixed_now + timedelta(hours=25),
    )

    # без исполнителя — даже если в окне, не отправляем
    Task.objects.create(
        title="No assignee",
        description="",
        priority=Task.Priority.MEDIUM,
        status=Task.Status.NEW,
        creator=creator,
        assignee=None,
        due_at=fixed_now + timedelta(hours=24, minutes=10),
    )

    # ── первый запуск: должен отправить 1 уведомление ──
    called_ids.clear()
    count1 = send_due_soon_reminders()

    assert count1 == 1
    assert called_ids == [in_window.id]

    # поле reminder_sent_at должно быть заполнено (если оно реализовано)
    # если поля нет — этот ассерт можно будет убрать, но лучше его реализовать.
    refreshed = Task.objects.get(id=in_window.id)
    assert getattr(refreshed, "reminder_sent_at", None) is not None

    # ── второй запуск: уведомлений быть не должно ──
    called_ids.clear()
    count2 = send_due_soon_reminders()

    assert count2 == 0
    assert called_ids == []


# ───────────────── signals: task_assignee_notification ─────────────────


class _DummyTaskWrapper:
    """
    Заглушка для send_task_assigned_notification.
    Поддерживает и прямой вызов, и .delay(...),
    чтобы тест прошёл независимо от того, как ты вызываешь Celery-таск в сигнале.
    """

    def __init__(self):
        self.called = False
        self.args = None
        self.kwargs = None

    def __call__(self, *args, **kwargs):
        self.called = True
        self.args = args
        self.kwargs = kwargs

    def delay(self, *args, **kwargs):
        self.called = True
        # помечаем, что был delay, но сам id тоже сохраняем
        self.args = ("delay",) + args
        self.kwargs = kwargs


@pytest.mark.django_db
def test_signal_task_assignee_notification_does_not_fire_without_assignee(
        creator, monkeypatch
):
    """
    Цель: при создании задачи без assignee сигнал не должен отправлять Celery-таск.
    """

    # гарантируем, что сигнал зарегистрирован
    import tasks.signals  # noqa: F401

    dummy = _DummyTaskWrapper()
    monkeypatch.setattr(
        "tasks.signals.send_task_assigned_notification",
        dummy,
    )

    Task.objects.create(
        title="No assignee",
        description="",
        priority=Task.Priority.MEDIUM,
        status=Task.Status.NEW,
        creator=creator,
        assignee=None,
    )

    assert dummy.called is False


@pytest.mark.django_db
def test_signal_task_assignee_notification_fires_on_create_with_assignee(
        creator, executor, monkeypatch
):
    """
    Цель: при создании задачи с assignee сигнал должен дернуть
    send_task_assigned_notification (либо напрямую, либо через .delay).
    """

    import tasks.signals  # noqa: F401

    dummy = _DummyTaskWrapper()
    monkeypatch.setattr(
        "tasks.signals.send_task_assigned_notification",
        dummy,
    )

    task = Task.objects.create(
        title="With assignee",
        description="",
        priority=Task.Priority.MEDIUM,
        status=Task.Status.NEW,
        creator=creator,
        assignee=executor,
    )

    assert dummy.called is True
    # в args либо сам id, либо ("delay", id)
    assert task.id in dummy.args
