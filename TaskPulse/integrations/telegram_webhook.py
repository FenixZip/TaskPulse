"""TaskPulse/integrations/telegram_webhook.py"""

import json
import logging
from typing import Any, Dict, Optional

from django.conf import settings
from django.http import HttpRequest, JsonResponse, HttpResponseForbidden
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from .models import TelegramProfile, TelegramLinkToken
from .notifications import send_telegram_message

logger = logging.getLogger(__name__)


def _get_setting(name: str, default: Optional[Any] = None) -> Any:
  """
  Безопасно читаем настройки, чтобы не падать, если чего-то нет.
  """
  return getattr(settings, name, default)


def _extract_message(update: Dict[str, Any]) -> Optional[Dict[str, Any]]:
  """
  Из апдейта Telegram достаём message/edited_message, если есть.
  Нас интересуют только текстовые сообщения.
  """
  if "message" in update:
      return update["message"]
  if "edited_message" in update:
      return update["edited_message"]
  return None


@csrf_exempt
def telegram_webhook(request: HttpRequest, secret: str) -> JsonResponse:
  """
  Обработчик вебхука Telegram.

  URL: /api/integrations/telegram/webhook/<secret>/

  - Проверяет secret из настроек.
  - Обрабатывает команды:
      /start <link_token>
      /help
  - Все остальные сообщения игнорирует.
  - В случае любой ошибки всегда возвращает { "ok": true },
    чтобы Telegram не отключал webhook.
  """
  expected_secret = _get_setting("TELEGRAM_WEBHOOK_SECRET")
  if expected_secret and secret != expected_secret:
      logger.warning("Invalid Telegram webhook secret received")
      return HttpResponseForbidden("Invalid webhook secret")

  if request.method != "POST":
      return JsonResponse({"ok": True})

  try:
      body_raw = request.body.decode("utf-8")
      update = json.loads(body_raw)
  except Exception:  # noqa: BLE001
      logger.exception("Failed to decode Telegram update")
      return JsonResponse({"ok": True})

  try:
      message = _extract_message(update)
      if not message:
          # нас интересуют только обычные сообщения
          return JsonResponse({"ok": True})

      chat = message.get("chat", {}) or {}
      chat_id = chat.get("id")
      if chat_id is None:
          # некуда отвечать
          return JsonResponse({"ok": True})

      text = (message.get("text") or "").strip()
      from_user = message.get("from", {}) or {}
      tg_user_id = from_user.get("id")

      # ----- /start -----
      if text.startswith("/start"):
          # /start или /start <token>
          parts = text.split(maxsplit=1)
          if len(parts) == 1:
              # просто /start без токена
              send_telegram_message(
                  chat_id,
                  "Привет! Чтобы привязать Telegram к вашему аккаунту TaskPulse, "
                  "перейдите по ссылке из личного кабинета.",
              )
              return JsonResponse({"ok": True})

          start_token = parts[1]

          try:
              link = (
                  TelegramLinkToken.objects
                  .select_related("user")
                  .get(token=start_token)
              )
          except TelegramLinkToken.DoesNotExist:
              # Токен не найден или уже удалён
              send_telegram_message(
                  chat_id,
                  "⚠️ Ссылка для привязки недействительна или уже удалена.",
              )
              return JsonResponse({"ok": True})

          user = link.user

          # Создаём/обновляем профиль сразу с нужными полями,
          # чтобы не было NULL в telegram_user_id / chat_id.
          profile, created = TelegramProfile.objects.update_or_create(
              user=user,
              defaults={
                  "telegram_user_id": tg_user_id,
                  "chat_id": chat_id,
                  "last_activity_at": timezone.now(),
              },
          )

          # Если в модели есть флаг одноразовости, помечаем токен использованным
          if hasattr(link, "is_used"):
              if not link.is_used:
                  link.is_used = True
                  link.save(update_fields=["is_used"])

          # Отправляем подтверждение в Telegram
          send_telegram_message(
              profile.chat_id,
              "✅ Telegram успешно привязан к вашему аккаунту TaskPulse.\n\n"
              "Теперь вы будете получать уведомления о задачах и дедлайнах здесь.",
          )

          return JsonResponse({"ok": True})

      # ----- /help -----
      if text == "/help":
          send_telegram_message(
              chat_id,
              "Я бот Pulse-zone. Я присылаю уведомления о задачах и напоминаниях 🚀",
          )
          return JsonResponse({"ok": True})

      # Остальные сообщения просто игнорируем
      return JsonResponse({"ok": True})

  except Exception:  # noqa: BLE001
      logger.exception("Error while handling Telegram webhook")
      # ВАЖНО: никогда не даём 500 Telegram'у
      return JsonResponse({"ok": True})
