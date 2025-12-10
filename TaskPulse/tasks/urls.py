"""tasks/urls.py"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import TaskViewSet, ConversationMessagesView
from .views_cabinet import (
    CreatorTasksView,
    CreatorStatsByAssigneeView,
    ExecutorTasksView,
    ExecutorTaskDetailView,
)
from .views_reports import monthly_report

router = DefaultRouter()
# основной вьюсет задач:
#   /api/tasks/           список
#   /api/tasks/{id}/      детально и т.д.
router.register("", TaskViewSet, basename="task")

urlpatterns = [
    # все CRUD-роуты для задач от вьюсета
    path("", include(router.urls)),

    # --- Кабинет создателя ---
    # список задач по исполнителям
    path(
        "cabinet/creator/tasks/",
        CreatorTasksView.as_view(),
        name="creator-tasks",
    ),
    # статистика по исполнителям
    path(
        "cabinet/creator/stats/by-assignee/",
        CreatorStatsByAssigneeView.as_view(),
        name="creator-stats-by-assignee",
    ),

    # --- Кабинет исполнителя ---
    path(
        "cabinet/executor/tasks/",
        ExecutorTasksView.as_view(),
        name="executor-tasks",
    ),
    path(
        "cabinet/executor/tasks/<int:pk>/",
        ExecutorTaskDetailView.as_view(),
        name="executor-task-detail",
    ),

    # --- Отчёт по задачам за месяц ---
    #   /api/tasks/reports/monthly/
    path(
        "reports/monthly/",
        monthly_report,
        name="reports-monthly",
    ),

    # --- Чат создатель ↔ исполнитель ---
    #   GET  /api/tasks/conversation-messages/?user_id=<id>
    #   POST /api/tasks/conversation-messages/
    path(
        "conversation-messages/",
        ConversationMessagesView.as_view(),
        name="task-conversation-messages",
    ),
]
