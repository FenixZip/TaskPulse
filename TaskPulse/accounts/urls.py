from django.urls import path
from .views import RegisterView, LoginView, InvitationCreateView, AcceptInviteView, verify_email

urlpatterns = [
    # Регистрация
    path("register", RegisterView.as_view()),
    # Логин
    path("login", LoginView.as_view()),
    # Создание инвайта (только для CREATOR)
    path("invitations", InvitationCreateView.as_view()),
    # Принятие инвайта (по токену)
    path("accept-invite", AcceptInviteView.as_view()),
    # Подтверждение email по токену
    path("verify-email", verify_email),
]
