"""serializers.py"""
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework.authtoken.models import Token

from .models import EmailVerificationToken, Invitation

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    """Сериализатор регистрации пользователя."""

    password = serializers.CharField(
        write_only=True,
        min_length=8,
        validators=[validate_password],  # используем стандартный валидатор прямо на поле
    )

    class Meta:
        """Модель, с которой работает сериализатор."""

        model = User
        fields = ("email", "password", "full_name", "company", "position")

    def create(self, validated_data):
        """Создаёт пользователя через менеджер create_user."""

        password = validated_data.pop("password")
        # стандартный менеджер user.set_password сам вызовется внутри create_user
        user = User.objects.create_user(password=password, **validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    """Сериализатор логина."""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    default_error_messages = {
        "invalid_credentials": "Неверные учетные данные.",
        "email_not_verified": "Подтвердите вашу почту, прежде чем войти.",
    }

    def validate(self, attrs):
        """Валидирует связку email+password."""

        email = attrs.get("email")
        password = attrs.get("password")

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError(self.error_messages["invalid_credentials"])

        if not user.check_password(password):
            raise serializers.ValidationError(self.error_messages["invalid_credentials"])

        if not getattr(user, "email_verified", False):
            # если email_verified нет в модели — getattr вернёт False
            raise serializers.ValidationError(self.error_messages["email_not_verified"])

        attrs["user"] = user
        return attrs


class InvitationCreateSerializer(serializers.ModelSerializer):
    """Сериализатор создания инвайта (только для CREATOR)."""

    class Meta:
        model = Invitation
        fields = ("email",)

    def create(self, validated_data):
        """Создаёт Invitation от имени текущего аутентифицированного пользователя."""

        request = self.context["request"]
        invitation = Invitation.objects.create(
            invited_by=request.user,
            **validated_data,
        )
        return invitation


class AcceptInviteSerializer(serializers.Serializer):
    """Сериализатор принятия инвайта."""

    token = serializers.UUIDField()
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        validators=[validate_password],
    )
    full_name = serializers.CharField(required=False, allow_blank=True)
    position = serializers.CharField(required=True, max_length=255)

    def create(self, validated_data):
        """Находит инвайт по токену, создаёт/обновляет пользователя EXECUTOR."""

        try:
            inv = Invitation.objects.get(
                token=validated_data["token"],
                accepted_at__isnull=True,
            )
        except Invitation.DoesNotExist:
            raise serializers.ValidationError("Инвайт недействителен")

        # компания берётся у создателя
        creator_company = inv.invited_by.company

        user, created = User.objects.get_or_create(
            email=inv.email,
            defaults={
                "role": User.Role.EXECUTOR,
                "company": creator_company,
                "position": validated_data["position"],
                "full_name": validated_data.get("full_name", ""),
            },
        )

        if created:
            # новый пользователь – задаём пароль и сохраняем
            user.set_password(validated_data["password"])
            user.save()
        else:
            # существующий пользователь – гарантируем роль и компанию/должность
            updated_fields = []

            if user.role != User.Role.EXECUTOR:
                user.role = User.Role.EXECUTOR
                updated_fields.append("role")

            if not user.company and creator_company:
                user.company = creator_company
                updated_fields.append("company")

            if not user.position and validated_data.get("position"):
                user.position = validated_data["position"]
                updated_fields.append("position")

            if updated_fields:
                user.save(update_fields=updated_fields)

        inv.mark_accepted()
        token, _ = Token.objects.get_or_create(user=user)

        return {"token": token.key, "email": user.email}


class VerifyEmailSerializer(serializers.Serializer):
    """Сериализатор подтверждения email."""

    token = serializers.UUIDField()

    def create(self, validated_data):
        """Выполняет подтверждение email по токену."""

        token = validated_data["token"]

        try:
            verification = EmailVerificationToken.objects.select_related("user").get(
                token=token
            )
        except EmailVerificationToken.DoesNotExist:
            raise serializers.ValidationError("Токен не найден.")

        if not verification.is_valid():
            raise serializers.ValidationError("Токен истёк или уже использован.")

        user = verification.user
        user.email_verified = True
        user.save(update_fields=["email_verified"])

        verification.mark_used()

        return {"email_verified": True}
