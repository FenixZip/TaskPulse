import django_filters
from .models import Task


class TaskFilter(django_filters.FilterSet):
    """
    Фильтры для списка задач:
    - по статусу, приоритету
    - по исполнителю (включая спец-значение me)
    - по интервалу дедлайна (due_at__gte / due_at__lte)
    """

    assignee = django_filters.CharFilter(method="filter_assignee")
    due_from = django_filters.IsoDateTimeFilter(field_name="due_at", lookup_expr="gte")
    due_to = django_filters.IsoDateTimeFilter(field_name="due_at", lookup_expr="lte")

    class Meta:
        model = Task
        fields = ["status", "priority"]

    def filter_assignee(self, queryset, _name, value):
        """Позволяет сделать ?assignee=me либо ?assignee=<user_id>."""

        if value == "me" and self.request and self.request.user.is_authenticated:
            return queryset.filter(assignee=self.request.user)
        if value.isdigit():
            return queryset.filter(assignee_id=int(value))
        return queryset
