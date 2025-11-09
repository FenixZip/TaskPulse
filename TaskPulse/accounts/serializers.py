"""serializers.py"""
from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework.authtoken.models import Token

from .models import EmailVerificationToken, Invitation, User


class RegisterSerializer(serializers.ModelSerializer):
    """Сериализатор регистрации пользователя."""
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        """Модель, с которой работает сериализатор"""
        model = User
        fields = ('email', 'password', 'company', 'full_name')
        extra_kwargs = {"role": {"required": False}}

    def create(self, validated_data):
        """Создаёт пользователя через менеджер create_user."""
        role = validated_data.get("role") or User.Role.CREATOR
        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            role=role,
        )

        return user


class LoginSerializer(serializers.Serializer):
    """Сериализатор логина"""
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, attrs):
        """Валидирует связку email+password через authenticate."""
        user = authenticate(email=attrs["email"], password=attrs["password"])
        if not user:
            raise serializers.ValidationError("Неверный email или пароль")
        if not user.is_active:
            raise serializers.ValidationError("Пользователь отключен")
        token, _ = Token.objects.get_or_create(user=user)
        return {"token": token.key}


class InvitationCreateSerializer(serializers.ModelSerializer):
    """Сериализатор создания инвайта (только для CREATOR):"""
    class Meta:
        model = Invitation
        fields = ("email",)

    def create(self, validated_data):
        """Создаёт Invitation от имени текущего аутентифицированного пользователя."""
        inviter = self.context["request"].user
        return Invitation.objects.create(email=validated_data["email"], invited_by=inviter)


class AcceptInviteSerializer(serializers.Serializer):
    """Сериализатор принятия инвайта."""
    token = serializers.UUIDField()
    password = serializers.CharField(write_only=True, min_length=8)
    full_name = serializers.CharField(required=False, allow_blank=True)

    def create(self, validated_data):
        """Находит инвайт по токену, создаёт/обновляет пользователя EXECUTOR."""
        try:
            inv = Invitation.objects.get(token=validated_data["token"], accepted_at__isnull=True)
        except Invitation.DoesNotExist:
            raise serializers.ValidationError("Инвайт недействителен")

        user, created = User.objects.get_or_create(
            email=inv.email,
            defaults={"role": User.Role.EXECUTOR},
        )

        if created:
            user.set_password(validated_data["password"])
            if name := validated_data.get("full_name"):
                user.first_name = name
            user.save()
        else:
            if user.role != User.Role.EXECUTOR:
                user.role = User.Role.EXECUTOR
                user.save(update_fields=["role"])

        inv.mark_accepted()
        token, _ = Token.objects.get_or_create(user=user)
        return {"token": token.key, "email": user.email}


class VerifyEmailSerializer(serializers.Serializer):
    """Сериализатор подтверждения email."""
    token = serializers.UUIDField()

    def create(self, validated_data):
        """Выполняет подтверждение."""
        try:
            t = EmailVerificationToken.objects.select_related("user").get(token=validated_data["token"])
        except EmailVerificationToken.DoesNotExist:
            raise serializers.ValidationError("Токен не найден")
        if not t.is_valid():
            raise serializers.ValidationError("Токен истёк или уже использован")
        user = t.user
        user.email_verified = True
        user.save(update_fields=["email_verified"])
        t.mark_used()
        return {"email_verified": True}
