"""accounts/urls.py"""

from django.urls import path

from .views import (
    AcceptInviteView,
    InvitationCreateView,
    LoginView,
    RegisterView,
    verify_email, ExecutorListView,
    ProfileView,
    ChangePasswordView,
    ResendVerificationView, PasswordResetConfirmView, PasswordResetRequestView,
)

app_name = "accounts"

urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", LoginView.as_view(), name="auth-login"),
    path("password-reset/", PasswordResetRequestView.as_view(), name="auth-password-reset"),
    path("password-reset-confirm/", PasswordResetConfirmView.as_view(), name="auth-password-reset-confirm"),
    path("invitations/", InvitationCreateView.as_view(), name="invitation-create"),
    path("accept-invite/", AcceptInviteView.as_view(), name="auth-accept-invite"),
    path("verify-email/", verify_email, name="auth-verify-email"),
    path(
        "resend-verification/",
        ResendVerificationView.as_view(),
        name="auth-resend-verification",
    ),

    path("executors/", ExecutorListView.as_view(), name="executor-list"),

    path("profile/", ProfileView.as_view(), name="auth-profile"),
    path("change-password/", ChangePasswordView.as_view(), name="auth-change-password"),
]
