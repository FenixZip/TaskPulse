"""integrations/views_api.py"""
from django.shortcuts import get_object_or_404
from integrations.models import TelegramProfile
from integrations.serializers import TelegramProfileSerializer
from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


class TelegramProfileViewSet(mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """
    Вьюсет только для «мой телеграм-профиль».
    URL можно настроить как /api/integrations/telegram/profile/
    и внутри всегда возвращать профиль текущего пользователя, если он есть.
    """

    serializer_class = TelegramProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        # либо вернём профиль, либо вызовем 404
        return get_object_or_404(TelegramProfile, user=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        """Переопределяем retrieve, чтобы вызвать get_object без pk в URL."""

        obj = self.get_object()
        serializer = self.get_serializer(obj)
        return Response(serializer.data)
