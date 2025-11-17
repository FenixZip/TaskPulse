from django.urls import path
from .views import RegisterView, LoginView, InvitationCreateView, AcceptInviteView, verify_email

urlpatterns = [
    # POST /api/auth/register → регистрация
    path("register/", RegisterView.as_view(), name="auth-register"),

    # POST /api/auth/login → логин за токеном
    path("login/", LoginView.as_view(), name="auth-login"),

    # POST /api/invitations → создать приглашение
    path("invitations/", InvitationCreateView.as_view(), name="invitation-create"),

    # Принятие инвайта (по токену)
    path("accept-invite/", AcceptInviteView.as_view(), name="accept-invite"),
    # Подтверждение email по токену
    path("verify-email/", verify_email, name="verify_email"),
]
