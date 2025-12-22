# Pulse-zone.tech

Pulse-zone.tech — веб-сервис для управления задачами и командной работой.  
Проект делается как основа под SaaS (не демо и не “учебка”).

**Продакшн:** https://pulse-zone.tech

---

## Что здесь есть

- Задачи и жизненный цикл (создание/назначение/статусы)
- Роли и доступы (создатель / исполнитель / админ)
- Приглашения пользователей
- Уведомления и напоминания
- Интеграция с Telegram (привязка через одноразовый токен)
- Отчёты и базовая статистика
- Фоновые задачи через очередь

---

## Стек

**Backend**
- Python 3.13.7
- Django 6.0 + Django REST Framework 3.16.1
- PostgreSQL 1.3.0
- Celery 5.6.0 + Redis 7.1.0
- JWT-аутентификация

**Frontend**
- React
- TypeScript
- Feature-Sliced Design (FSD)

**Интеграции**
- Telegram Bot (deep-link + one-time token)

---

## Как устроен проект

### Backend (Django)

Код разделён на доменные приложения:

- `accounts` — пользователи, роли, авторизация, приглашения
- `tasks` — задачи, напоминания, отчёты
- `integrations` — Telegram и внешние сервисы

Асинхронные операции (уведомления/напоминания) выполняются через Celery.

### Frontend (React)

Фронтенд построен по Feature-Sliced Design:

- `entities` — доменные сущности
- `features` — пользовательские сценарии
- `pages` — страницы
- `app` — роутинг, guards, провайдеры
- `shared` — UI и утилиты

Есть guards для:
- авторизации
- ролей
- обязательной привязки Telegram

---

## Telegram

Привязка Telegram сделана через deep-link:

- пользователь получает уникальную ссылку вида `t.me/<bot>?start=<uuid>`
- токен одноразовый
- user_id напрямую не передаётся

---

## Локальный запуск

### Backend

~~~bash
python -m venv venv
source venv/bin/activate

pip install -r requirements.txt

python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
~~~

### Frontend

~~~bash
cd Pulse-zone.tech-frontend
npm install
npm run dev
~~~

---

## Переменные окружения

Нужны как минимум:
- настройки базы данных
- JWT-ключи/секреты
- Redis/Celery
- Telegram bot token

Смотри примеры в `.env`.

---

## Тесты

Подход: unit / integration / e2e (сквозные сценарии).

- Backend: `pytest`
- Frontend: стандартные инструменты React-экосистемы (юнит/интеграционные) + e2e отдельно

---

## Статус

Проект в активной разработке. Архитектура рассчитана на расширение функционала и рост нагрузки.

---

## Автор

Олег Сорокин

Telegram - @OlegSorokinMsk
