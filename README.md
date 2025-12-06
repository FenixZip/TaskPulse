npm run dev
python manage.py shell
docker compose up -d --build

python manage.py flush
curl "http://localhost:8000/api/auth/verify-email/?token=92424c72-751b-4a0f-8fcd-457dc2619b1d"
from tasks.tasks_reminders import send_task_assigned_notification

send_task_assigned_notification.delay(999999)

docker compose up -d
python manage.py runserver 0.0.0.0:8000
celery -A TaskPulse worker -l info -P solo
celery -A TaskPulse beat -l info


from integrations.notifications import send_telegram_message
send_telegram_message(493089867, "Тестовое сообщение от Pulse-zone")


docker compose down
docker compose build
docker compose up -d


nginx -t
systemctl reload nginx


docker stop amnezia-xray amnezia-awg
mkdir -p /var/www/taskpulse_frontend
cp -r ~/opt/taskpulse/TaskPulse/taskpulse-frontend/dist/* /var/www/taskpulse_frontend/


echo ".env.prod" >> .gitignore
git rm -r --cached .
git commit -m "Remove .env.prod from repo and ignore it"
git push






