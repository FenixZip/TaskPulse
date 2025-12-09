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

# ВАЖНО:
# Регистрируем TaskViewSet без префикса, чтобы:
#   GET /api/tasks/        -> список задач
#   GET /api/tasks/{id}/   -> детали задачи
router.register(r"", TaskViewSet, basename="task")

urlpatterns = [
    # Стандартные DRF-роуты для задач:
    #   /api/tasks/           (список + создание)
    #   /api/tasks/{id}/      (детали/изменение/удаление)
    path("", include(router.urls)),

    # Кабинет Создателя
    #   /api/tasks/cabinet/creator/tasks/
    path(
        "cabinet/creator/tasks/",
        CreatorTasksView.as_view(),
        name="creator-tasks",
    ),
    #   /api/tasks/cabinet/creator/stats-by-assignee/
    path(
        "cabinet/creator/stats-by-assignee/",
        CreatorStatsByAssigneeView.as_view(),
        name="creator-stats-by-assignee",
    ),

    # Кабинет Исполнителя
    #   /api/tasks/cabinet/executor/tasks/
    path(
        "cabinet/executor/tasks/",
        ExecutorTasksView.as_view(),
        name="executor-tasks",
    ),
    #   /api/tasks/cabinet/executor/tasks/<pk>/
    path(
        "cabinet/executor/tasks/<int:pk>/",
        ExecutorTaskDetailView.as_view(),
        name="executor-task-detail",
    ),

    # Отчёт по задачам за месяц
    #   /api/tasks/reports/monthly/
    path(
        "reports/monthly/",
        monthly_report,
        name="reports-monthly",
    ),

    # Чат создатель ↔ исполнитель
    #   GET  /api/tasks/conversation-messages/?user_id=<id>
    #   POST /api/tasks/conversation-messages/
    #   (именно такой путь дергает фронт)
    path(
        "conversation-messages/",
        ConversationMessagesView.as_view(),
        name="task-conversation-messages",
    ),
]
