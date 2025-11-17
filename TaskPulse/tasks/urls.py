"""tasks/urls.py"""
from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import TaskViewSet
from .views_reports import MonthlyReportView

router = DefaultRouter()
router.register(r"tasks", TaskViewSet, basename="task")

urlpatterns = []
urlpatterns += router.urls
urlpatterns += [
    path("reports/monthly/", MonthlyReportView.as_view(), name="reports-monthly")
]
