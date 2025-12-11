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
router.register("", TaskViewSet, basename="task")

urlpatterns = [
    # --- Чат создатель ↔ исполнитель ---
    #   GET  /api/tasks/conversation-messages/?user_id=<id>
    #   POST /api/tasks/conversation-messages/
    path(
        "conversation-messages/",
        ConversationMessagesView.as_view(),
        name="task-conversation-messages",
    ),

    # --- Кабинет создателя ---
    path(
        "cabinet/creator/tasks/",
        CreatorTasksView.as_view(),
        name="creator-tasks",
    ),
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
    path(
        "reports/monthly/",
        monthly_report,
        name="reports-monthly",
    ),

    # все CRUD-роуты для задач от вьюсета (должен быть В КОНЦЕ)
    path("", include(router.urls)),
]
