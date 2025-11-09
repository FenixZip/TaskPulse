from django.contrib.auth import get_user_model
from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .permissions import IsCreator
from .serializers import (
    RegisterSerializer, LoginSerializer,
    InvitationCreateSerializer, AcceptInviteSerializer,
    VerifyEmailSerializer
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """
    POST /api/auth/register
    Регистрирует пользователя (обычно CREATOR).
    Сигнал post_save отправит письмо для подтверждения email.
    """
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class LoginView(generics.GenericAPIView):
    """
    POST /api/auth/login
    Принимает email/пароль, возвращает токен.
    """
    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        """
        Обрабатывает POST-запрос:
        - валидирует данные
        - возвращает токен в ответе
        """
        data = self.get_serializer(data=request.data)
        data.is_valid(raise_exception=True)
        return Response(data.validated_data)


class InvitationCreateView(generics.CreateAPIView):
    """
    POST /api/auth/invitations
    Создаёт инвайт для email. Письмо уйдёт сигналом.
    Доступно только CREATOR.
    """
    serializer_class = InvitationCreateSerializer
    permission_classes = [permissions.IsAuthenticated, IsCreator]


class AcceptInviteView(generics.CreateAPIView):
    """
    POST /api/auth/accept-invite
    Принимает token инвайта, пароль и, опционально, имя.
    Создаёт/обновляет пользователя EXECUTOR и возвращает токен.
    """
    serializer_class = AcceptInviteSerializer
    permission_classes = [permissions.AllowAny]


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def verify_email(request):
    """
    GET /api/auth/verify-email?token=UUID
    Подтверждает email, если токен валиден.
    Возвращает {"email_verified": true}.
    """
    # Собираем сериализатор из query-параметра token
    ser = VerifyEmailSerializer(data={"token": request.query_params.get("token")})
    # Валидируем входные данные
    ser.is_valid(raise_exception=True)
    # Выполняем create() сериализатора — он отметит почту подтверждённой
    result = ser.save()
    # Возвращаем результат
    return Response(result)
