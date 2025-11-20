"""tasks/urls.py"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import TaskViewSet
from .views_reports import monthly_report

router = DefaultRouter()
router.register(r"tasks", TaskViewSet, basename="task")

urlpatterns = [
    # все стандартные эндпоинты TaskViewSet:
    #   /tasks/ , /tasks/{id}/ и т.п.
    path("", include(router.urls)),

    # отчёт по задачам за месяц:
    #   name="reports-monthly" — именно его используют тесты через reverse()
    path("reports/monthly/", monthly_report, name="reports-monthly"),
]
