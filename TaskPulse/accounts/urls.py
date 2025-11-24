"""accounts/urls.py"""

from django.urls import path

from .views import (
    AcceptInviteView,
    InvitationCreateView,
    LoginView,
    RegisterView,
    verify_email, ExecutorListView,
    ProfileView,
    ChangePasswordView
)

app_name = "accounts"

urlpatterns = [
    # POST /api/auth/register/
    path("register/", RegisterView.as_view(), name="auth-register"),
    # POST /api/auth/login/
    path("login/", LoginView.as_view(), name="auth-login"),
    # POST /api/auth/invitations/
    path("invitations/", InvitationCreateView.as_view(), name="invitation-create"),
    # POST /api/auth/accept-invite/
    path("accept-invite/", AcceptInviteView.as_view(), name="auth-accept-invite"),
    # GET /api/auth/verify-email/?token=...
    path("verify-email/", verify_email, name="auth-verify-email"),
    path("executors/", ExecutorListView.as_view(), name="executor-list"),

    # Личный кабинет
    path("profile/", ProfileView.as_view(), name="auth-profile"),
    path("change-password/", ChangePasswordView.as_view(), name="auth-change-password"),
]
