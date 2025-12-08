"""TaskPulse/integrations/views_api.py"""

from django.conf import settings
from django.shortcuts import get_object_or_404

from integrations.models import TelegramProfile, TelegramLinkToken
from integrations.serializers import TelegramProfileSerializer

from rest_framework import mixins, status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


class TelegramProfileViewSet(mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """
    Вьюсет только для «моего телеграм-профиля».

    URL: /api/integrations/telegram/profile/

    Возвращает профиль Telegram текущего пользователя, если он существует.
    """

    serializer_class = TelegramProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        """Всегда ищем профиль по текущему пользователю, pk не нужен."""
        return get_object_or_404(TelegramProfile, user=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        obj = self.get_object()
        serializer = self.get_serializer(obj)
        return Response(serializer.data)


class TelegramLinkStartView(APIView):
    """
    POST /api/integrations/telegram/link-start/

    Создаёт одноразовый TelegramLinkToken для текущего пользователя
    и возвращает deep-link на бота:

        https://t.me/<TELEGRAM_BOT_NAME>?start=<token>
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        bot_name = getattr(settings, "TELEGRAM_BOT_NAME", "").strip()
        if not bot_name:
            return Response(
                {"detail": "TELEGRAM_BOT_NAME не настроен."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        link_token = TelegramLinkToken.objects.create(user=request.user)
        deep_link = f"https://t.me/{bot_name}?start={link_token.token}"

        return Response({"link": deep_link}, status=status.HTTP_200_OK)
