from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags


def send_html_email(subject: str, template_name: str, context: dict, to_email: str):
    """Универсальная отправка HTML-писем с текстовым фолбеком."""

    html_content = render_to_string(template_name, context)
    text_content = strip_tags(html_content)

    from_email = settings.DEFAULT_FROM_EMAIL

    msg = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email=from_email,
        to=[to_email],
    )
    msg.attach_alternative(html_content, "text/html")
    msg.send()


def send_verification_email(user, token):
    """Письмо для подтверждения email."""

    base = getattr(settings, "FRONTEND_BASE_URL", "").rstrip("/")
    verify_link = f"{base}/api/auth/verify-email?token={token.token}"

    context = {
        "user": user,
        "verify_link": verify_link,
    }

    send_html_email(
        subject="TaskPulse — подтвердите вашу почту",
        template_name="emails/verify_email.html",
        context=context,
        to_email=user.email,
    )


def send_invite_email(invitation, invite_token: str):
    """Письмо-приглашение в рабочее пространство."""

    base = getattr(settings, "FRONTEND_BASE_URL", "").rstrip("/")
    invite_link = f"{base}/invite/accept?token={invite_token}"

    context = {
        "invitee_name": getattr(invitation, "full_name", "") or "",
        "workspace_name": getattr(invitation, "workspace_name", None)
                          or getattr(invitation, "company_name", None)
                          or "ваше рабочее пространство",
        "inviter_name": getattr(invitation, "inviter_name", ""),
        "invite_link": invite_link,
    }

    send_html_email(
        subject="TaskPulse — приглашение в рабочее пространство",
        template_name="emails/invite_email.html",
        context=context,
        to_email=invitation.email,
    )


def send_password_reset_email(user, reset_token: str):
    """Письмо для сброса пароля."""

    base = getattr(settings, "FRONTEND_BASE_URL", "").rstrip("/")
    reset_link = f"{base}/reset-password?token={reset_token}"

    context = {
        "user": user,
        "reset_link": reset_link,
    }

    send_html_email(
        subject="TaskPulse — сброс пароля",
        template_name="emails/password_reset_email.html",
        context=context,
        to_email=user.email,
    )
