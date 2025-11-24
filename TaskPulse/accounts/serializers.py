"""accounts/serializers.py"""

from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import serializers
from rest_framework.authtoken.models import Token

from .models import EmailVerificationToken, Invitation

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    """Сериализатор регистрации пользователя."""

    password = serializers.CharField(
        write_only=True,
        min_length=8,
        validators=[
            validate_password
        ],  # используем стандартный валидатор прямо на поле
    )

    class Meta:
        """Модель, с которой работает сериализатор."""

        model = User
        fields = ("email", "password", "full_name", "company", "position")

    def create(self, validated_data):
        """Создаёт пользователя через менеджер create_user."""

        password = validated_data.pop("password")
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
        """Валидирует связку email+password через authenticate()."""

        email = attrs.get("email")
        password = attrs.get("password")
        request = self.context.get("request")

        user = authenticate(request=request, email=email, password=password)

        if not user:
            raise serializers.ValidationError({"detail": self.error_messages["invalid_credentials"]})

        if not getattr(user, "email_verified", False):
            raise serializers.ValidationError(self.error_messages["email_not_verified"])

        attrs["user"] = user
        return attrs


class ProfileSerializer(serializers.ModelSerializer):
    """Профиль текущего пользователя (создателя или исполнителя)."""

    invited_by = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "role",
            "avatar",
            "full_name",
            "company",
            "position",
            "email",
            "invited_by",
        )
        read_only_fields = ("id", "role", "invited_by")

    def get_invited_by(self, obj):
        """
        Для исполнителя вернём ФИО/почту того, кто его пригласил.
        Для создателя будет None.
        """

        invite = (
            Invitation.objects.filter(email=obj.email, accepted_at__isnull=False)
            .select_related("invited_by")
            .order_by("-accepted_at")
            .first()
        )

        if invite and invite.invited_by:
            return invite.invited_by.full_name or invite.invited_by.email
        return None


class ChangePasswordSerializer(serializers.Serializer):
    """Смена пароля в личном кабинете."""

    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Неверный текущий пароль.")
        return value

    def validate_new_password(self, value):
        validate_password(value)
        return value

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save()
        return user


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
            inv = Invitation.objects.select_related("invited_by").get(
                token=validated_data["token"],
                accepted_at__isnull=True,
            )
        except Invitation.DoesNotExist:
            raise serializers.ValidationError("Инвайт недействителен")

        creator_company = inv.invited_by.company

        with transaction.atomic():
            user, created = User.objects.get_or_create(
                email=inv.email,
                defaults={
                    "role": User.Role.EXECUTOR,
                    "company": creator_company,
                    "position": validated_data["position"],
                    "full_name": validated_data.get("full_name", ""),
                    # раз инвайт дошёл до почты – считаем email подтверждённым
                    "email_verified": True,
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

                if not user.email_verified:
                    user.email_verified = True
                    updated_fields.append("email_verified")

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


class ExecutorSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "full_name", "company", "position")
