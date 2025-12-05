# Dockerfile
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Системные зависимости для psycopg2 и т.д.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       build-essential \
       libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Установим зависимости
COPY TaskPulse/TaskPulse/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Копируем весь проект
COPY TaskPulse/ /app/

# Дальше будем работать из папки с manage.py
WORKDIR /app/TaskPulse

EXPOSE 8000

# Старт gunicorn
CMD ["gunicorn", "TaskPulse.wsgi:application", "--bind", "0.0.0.0:8000"]
