"""accounts/views.py"""

from django.contrib.auth import get_user_model
from rest_framework import generics, permissions
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView

from .permissions import IsCreator
from .serializers import (
    AcceptInviteSerializer,
    InvitationCreateSerializer,
    LoginSerializer,
    RegisterSerializer,
    VerifyEmailSerializer, ExecutorSerializer,
    ProfileSerializer,
    ChangePasswordSerializer,
    ResendVerificationSerializer, PasswordResetConfirmSerializer, PasswordResetRequestSerializer,
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

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response(
            {
                "detail": "Пользователь создан. Проверьте почту и подтвердите email.",
                "email": user.email,
            },
            status=201,
        )


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
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        token, _ = Token.objects.get_or_create(user=user)

        return Response(
            {
                "token": token.key,
                "email": user.email,
                "role": user.role,
            }
        )


class PasswordResetConfirmView(generics.CreateAPIView):
    """
    POST /api/auth/password-reset-confirm/
    {
      "reset_token": "<uidb64:token>",
      "new_password": "...",
      "new_password_confirm": "..."
    }
    """

    serializer_class = PasswordResetConfirmSerializer
    permission_classes = [permissions.AllowAny]


class ProfileView(generics.RetrieveUpdateAPIView):
    """
    GET /api/auth/profile/  — получить данные профиля
    PUT/PATCH /api/auth/profile/ — обновить (аватар, ФИО, компания, должность, email)
    """

    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class PasswordResetRequestView(generics.CreateAPIView):
    """
    POST /api/auth/password-reset/
    {
      "email": "user@example.com"
    }
    """

    serializer_class = PasswordResetRequestSerializer
    permission_classes = [permissions.AllowAny]


class ChangePasswordView(APIView):
    """
    POST /api/auth/change-password/
    {
    "current_password": "...",
    "new_password": "..."
    }
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Пароль успешно изменён."})


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


class ExecutorListView(generics.ListAPIView):
    """
    GET /api/auth/executors/
    Возвращает всех исполнителей, принадлежащих текущему Создателю.
    """

    serializer_class = ExecutorSerializer
    permission_classes = [permissions.IsAuthenticated, IsCreator]

    def get_queryset(self):
        user = self.request.user  # это Создатель
        # Простой критерий: все EXECUTORы из той же компании, что и создатель
        return User.objects.filter(
            role=User.Role.EXECUTOR,
            company=user.company,
        )


class ResendVerificationView(generics.CreateAPIView):
    """
    POST /api/auth/resend-verification
    Принимает email, повторно отправляет письмо подтверждения.
    """

    serializer_class = ResendVerificationSerializer
    permission_classes = [permissions.AllowAny]
