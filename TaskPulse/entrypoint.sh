#!/bin/sh
set -e

# Ждём базу (немного грубовато, но для начала ок)
echo "Waiting for db..."
sleep 5

echo "Applying migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting Gunicorn..."
gunicorn TaskPulse.wsgi:application --bind 0.0.0.0:8000 --workers 3
