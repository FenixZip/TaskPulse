"""integrations/views_telegram.py"""
from __future__ import annotations

import logging
import uuid
from datetime import timedelta
from typing import Optional, Tuple

from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from integrations.models import TelegramProfile, TelegramUpdate, TelegramLinkToken
from integrations.permissions import IsTelegramWebhook
from integrations.utils_telegram import send_telegram_message
from tasks.models import Task, TaskActionLog

User = get_user_model()
logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name="dispatch")
class TelegramWebhookView(APIView):
    """
    CBV-обработчик Telegram-вебхука.
    - проверяем секрет вебхука через IsTelegramWebhook;
    - отсекаем дубликаты по update_id;
    - обрабатываем /start <token> и callback-кнопки.
    """

    authentication_classes: list = []
    permission_classes = [IsTelegramWebhook]

    def post(self, request: Request, *args, **kwargs) -> Response:
        """Основной вход, куда Telegram присылает JSON update."""

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

    def _is_duplicate_update(self, update_id: int) -> bool:
        """
        Идемпотентность по update_id через модель TelegramUpdate.
        Если запись с таким update_id уже существует – считаем дубликатом.
        """

        try:
            TelegramUpdate.objects.create(update_id=update_id)
            return False
        except IntegrityError:
            return True

    # ---------------------- обработка обычных сообщений ---------------------- #

    def _handle_message(self, message: dict) -> None:
        """
        Обрабатывает обычные текстовые сообщения.
        Сейчас интересует только /start <token>.
        """

        chat_id = message["chat"]["id"]
        text = (message.get("text") or "").strip()

        if text.startswith("/start"):
            parts = text.split(maxsplit=1)
            token = parts[1].strip() if len(parts) > 1 else ""
            self._handle_start_command(chat_id, token, message)
        else:
            # пока других команд не поддерживаем
            send_telegram_message(
                chat_id,
                "Я пока понимаю только команду:\n"
                "<code>/start ВАШ_ТОКЕН</code>",
            )

    def _handle_start_command(self, chat_id: int, token: str, message: dict) -> None:
        """
        Обработка /start <token>:
        - token — это UUID из TelegramLinkToken;
        - ищем TelegramLinkToken, создаём/обновляем TelegramProfile;
        - помечаем токен как использованный.
        """

        telegram_id = message["from"]["id"]

        if not token:
            send_telegram_message(
                chat_id,
                "Не найден токен. Отправьте команду вида:\n"
                "<code>/start ВАШ_ТОКЕН</code>",
            )
            return

        # токен должен быть UUID из TelegramLinkToken
        try:
            token_uuid = uuid.UUID(token)
        except ValueError:
            send_telegram_message(
                chat_id,
                "Некорректный формат токена. "
                "Скопируйте ссылку /start из веб-профиля полностью.",
            )
            return

        try:
            link = TelegramLinkToken.objects.select_related("user").get(
                token=token_uuid,
                is_used=False,
            )
        except TelegramLinkToken.DoesNotExist:
            send_telegram_message(
                chat_id,
                "Токен не найден или уже использован. "
                "Сгенерируйте новый токен в веб-профиле.",
            )
            return

        # создаём или обновляем TelegramProfile для пользователя
        TelegramProfile.objects.update_or_create(
            user=link.user,
            defaults={
                "telegram_user_id": telegram_id,
                "chat_id": chat_id,
            },
        )

        # помечаем токен как использованный
        link.is_used = True
        link.save(update_fields=["is_used"])

        send_telegram_message(
            chat_id,
            "✅ Telegram-аккаунт успешно привязан к вашему профилю.",
        )

    # --------------------- обработка callback-кнопок --------------------- #

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

        # ищем профиль по telegram_user_id
        try:
            profile = TelegramProfile.objects.select_related("user").get(
                telegram_user_id=telegram_id
            )
            user = profile.user
        except TelegramProfile.DoesNotExist:
            send_telegram_message(
                chat_id,
                "Ваш Telegram-аккаунт не привязан к профилю. "
                "Зайдите в веб-версию и получите ссылку /start.",
            )
            return

        # ищем задачу, принадлежащую этому пользователю
        try:
            # ⚠️ здесь подставь нужное поле связи с пользователем
            task = Task.objects.get(pk=task_id, assignee=user)
        except Task.DoesNotExist:
            send_telegram_message(
                chat_id,
                f"Задача с ID {task_id} не найдена или вам не принадлежит.",
            )
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
        except (ValueError, AttributeError):
            return None, None

    # ------------------------- бизнес-обработчики ------------------------- #

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
