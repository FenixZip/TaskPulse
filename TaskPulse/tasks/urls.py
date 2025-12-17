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
router.register("", TaskViewSet, basename="task")

urlpatterns = [
    path(
        "conversation-messages/",
        ConversationMessagesView.as_view(),
        name="task-conversation-messages",
    ),

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

    path(
        "reports/monthly/",
        monthly_report,
        name="reports-monthly",
    ),

    path("", include(router.urls)),
]
