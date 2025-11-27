npm run dev
python manage.py shell
docker compose up -d --build

curl "http://localhost:8000/api/auth/verify-email/?token=660ef401-4061-426b-b707-b37ee3196024"
from tasks.tasks_reminders import send_task_assigned_notification

send_task_assigned_notification.delay(999999)

docker compose up -d
python manage.py runserver 0.0.0.0:8000
celery -A TaskPulse worker -l info -P solo
celery -A TaskPulse beat -l info
docker compose up -d







