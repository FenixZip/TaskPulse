"""tasks/filters.py"""

import django_filters

from .models import Task


class TaskFilter(django_filters.FilterSet):
    """Фильтры для списка задач:"""

    name = django_filters.CharFilter(field_name="title", lookup_expr="icontains")

    assignee = django_filters.CharFilter(method="filter_assignee")

    position = django_filters.CharFilter(
        field_name="assignee__position", lookup_expr="icontains"
    )

    due_from = django_filters.IsoDateTimeFilter(field_name="due_at", lookup_expr="gte")
    due_to = django_filters.IsoDateTimeFilter(field_name="due_at", lookup_expr="lte")

    class Meta:
        model = Task
        fields = ["status", "priority", "name", "position"]

    def filter_assignee(self, queryset, _name, value):
        """Позволяет сделать:"""

        if not value:
            return queryset

        if value == "me" and self.request and self.request.user.is_authenticated:
            return queryset.filter(assignee=self.request.user)

        if value.isdigit():
            return queryset.filter(assignee_id=int(value))

        return queryset
