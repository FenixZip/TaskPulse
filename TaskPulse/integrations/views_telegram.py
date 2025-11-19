"""integrations/views_telegram.py"""

from __future__ import annotations

import logging
from datetime import timedelta
from typing import Optional, Tuple

import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from tasks.models import Task, TaskActionLog

User = get_user_model()
logger = logging.getLogger(__name__)


def send_telegram_message(chat_id: int, text: str) -> None:
    """Отправляет простое текстовое сообщение в Telegram-чат."""

    bot_token = getattr(settings, "TELEGRAM_BOT_TOKEN", None)
    if not bot_token:
        logger.warning("TELEGRAM_BOT_TOKEN не настроен, сообщение не отправлено")
        return

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
    }

    try:
        resp = requests.post(url, json=payload, timeout=5)
        if resp.status_code != 200:
            logger.warning("Telegram API sendMessage error: %s", resp.text)
    except Exception:  # noqa: BLE001
        logger.exception("Ошибка при отправке сообщения в Telegram")


@method_decorator(csrf_exempt, name="dispatch")
class TelegramWebhookView(APIView):
    """
    CBV-обработчик Telegram-вебхука.
    - проверяем секрет вебхука (если TELEGRAM_WEBHOOK_SECRET настроен);
    - отсекаем дубликаты по update_id;
    - обрабатываем /start <token> и callback-кнопки.
    """

    authentication_classes: list = []
    permission_classes: list = []

    def post(self, request: Request, *args, **kwargs) -> Response:
        """Основной вход, куда Telegram присылает JSON update."""

        if not self._check_secret(request):
            return Response({"detail": "Forbidden"}, status=403)

        update = request.data

        update_id = update.get("update_id")
        if update_id is not None and self._is_duplicate_update(update_id):
            return Response({"status": "duplicate"})

        if "message" in update:
            self._handle_message(update["message"])
        elif "callback_query" in update:
            self._handle_callback_query(update["callback_query"])
        else:
            logger.info("Unsupported Telegram update type: %s", update.keys())

        return Response({"status": "ok"})

    def _check_secret(self, request: Request) -> bool:
        """Проверяет X-Telegram-Bot-Api-Secret-Token, если TELEGRAM_WEBHOOK_SECRET задан."""

        expected_secret = getattr(settings, "TELEGRAM_WEBHOOK_SECRET", None)
        if not expected_secret:
            return True

        got = request.headers.get("X-Telegram-Bot-Api-Secret-Token")
        return got == expected_secret

    def _is_duplicate_update(self, update_id: int) -> bool:
        """Примитивная идемпотентность по update_id через кэш."""

        cache_key = f"telegram_update_{update_id}"
        if cache.get(cache_key):
            return True
        cache.set(cache_key, True, timeout=300)
        return False

    def _handle_message(self, message: dict) -> None:
        """Обрабатывает обычные текстовые сообщения. Сейчас интересует только /start."""

        chat_id = message["chat"]["id"]
        text = message.get("text", "")

        if text.startswith("/start"):
            parts = text.split(maxsplit=1)
            token = parts[1] if len(parts) > 1 else ""
            self._handle_start_command(chat_id=chat_id, token=token, message=message)
        else:
            send_telegram_message(
                chat_id,
                "Привет! Используйте /start <токен>, чтобы привязать Telegram-аккаунт к профилю.",
            )

    def _handle_start_command(self, chat_id: int, token: str, message: dict) -> None:
        """Обработка /start <token>: ищем пользователя по токену и сохраняем telegram_id."""

        telegram_id = message["from"]["id"]

        if not token:
            send_telegram_message(
                chat_id,
                "Не найден токен. Отправьте команду вида:\n"
                "<code>/start ВАШ_ТОКЕН</code>",
            )
            return

        try:
            user_id = int(token)
            user = User.objects.get(pk=user_id)
        except (ValueError, User.DoesNotExist):
            send_telegram_message(
                chat_id,
                "Не удалось найти пользователя по токену. "
                "Убедитесь, что используете правильную ссылку из профиля.",
            )
            return

        user.telegram_id = telegram_id
        user.save(update_fields=["telegram_id"])

        send_telegram_message(
            chat_id,
            "✅ Telegram-аккаунт успешно привязан к вашему профилю.",
        )

    def _handle_callback_query(self, callback: dict) -> None:
        """Обрабатывает callback_query от инлайн-кнопок."""

        from_user = callback["from"]
        telegram_id = from_user["id"]
        chat_id = callback["message"]["chat"]["id"]
        data = callback.get("data", "")

        action, task_id = self._parse_callback_data(data)
        if action is None or task_id is None:
            send_telegram_message(chat_id, "Не удалось распознать действие кнопки.")
            return

        try:
            user = User.objects.get(telegram_id=telegram_id)
        except User.DoesNotExist:
            send_telegram_message(
                chat_id,
                "Ваш Telegram-аккаунт не привязан к профилю. "
                "Зайдите в веб-версию и получите ссылку /start.",
            )
            return

        try:
            task = Task.objects.get(pk=task_id)
        except Task.DoesNotExist:
            send_telegram_message(chat_id, f"Задача с ID {task_id} не найдена.")
            return

        if action == "confirm_on_time":
            self._handle_confirm_on_time(task=task, user=user, chat_id=chat_id)
        elif action == "extend_1d":
            self._handle_extend_1d(task=task, user=user, chat_id=chat_id)
        else:
            send_telegram_message(chat_id, "Неизвестный тип действия.")

    def _parse_callback_data(self, data: str) -> Tuple[Optional[str], Optional[int]]:
        """Разбирает callback_data вида 'action:task_id'."""

        try:
            action, task_id_str = data.split(":", maxsplit=1)
            task_id = int(task_id_str)
            return action, task_id
        except Exception:  # noqa: BLE001
            logger.warning("Не удалось распарсить callback_data: %r", data)
            return None, None

    # ===== конкретные действия =====

    def _handle_confirm_on_time(self, task: Task, user: User, chat_id: int) -> None:
        """«Сделаю вовремя»: пишем запись в TaskActionLog."""

        TaskActionLog.log_action(
            task=task,
            user=user,
            action=TaskActionLog.Action.CONFIRM_ON_TIME,
            comment="Подтверждение через Telegram: сделаю вовремя.",
        )

        send_telegram_message(
            chat_id,
            f"👌 Задача #{task.id} будет выполнена вовремя.",
        )

    def _handle_extend_1d(self, task: Task, user: User, chat_id: int) -> None:
        """«Продлить на сутки»: двигаем due_at на +1 день и логируем действие."""

        old_due = task.due_at
        base_dt = task.due_at or timezone.now()
        new_due = base_dt + timedelta(days=1)

        task.due_at = new_due
        task.save(update_fields=["due_at"])

        TaskActionLog.log_action(
            task=task,
            user=user,
            action=TaskActionLog.Action.EXTEND_DUE_1D,
            comment="Продление на 1 день через Telegram.",
            old_due_at=old_due,
            new_due_at=new_due,
        )

        send_telegram_message(
            chat_id,
            f"⏰ Дедлайн задачи #{task.id} перенесён на {new_due}.",
        )
