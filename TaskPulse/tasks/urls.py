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
router.register(r"tasks", TaskViewSet, basename="task")

urlpatterns = [
    # все стандартные эндпоинты TaskViewSet:
    #   /tasks/ , /tasks/{id}/ и т.п.
    path("", include(router.urls)),

    # Личные кабинеты
    path("me/creator/tasks/", CreatorTasksView.as_view(), name="creator-tasks"),
    path(
        "me/creator/stats-by-assignee/",
        CreatorStatsByAssigneeView.as_view(),
        name="creator-stats-by-assignee",
    ),
    path("me/executor/tasks/", ExecutorTasksView.as_view(), name="executor-tasks"),
    path(
        "me/executor/tasks/<int:pk>/",
        ExecutorTaskDetailView.as_view(),
        name="executor-task-detail",
    ),

    # отчёт по задачам за месяц:
    #   name="reports-monthly" — именно его используют тесты через reverse()
    path("reports/monthly/", monthly_report, name="reports-monthly"),

    # Сообщения
    path(
        "tasks/conversation-messages/",
        ConversationMessagesView.as_view(),
        name="task-conversation-messages",
    )
]
