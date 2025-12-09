npm run dev
python manage.py shell
docker compose build web
docker compose up -d

npm run build
cp -r ~/opt/taskpulse/TaskPulse/taskpulse-frontend/dist/* /var/www/taskpulse_frontend/

nginx -t
systemctl reload nginx

docker logs -f taskpulse-web
docker exec -it taskpulse-web python manage.py flush --no-input
docker exec -it taskpulse-web python manage.py migrate


export TELEGRAM_BOT_TOKEN="8219195501:AAH9WLtZiEp5Reez1FUoXN2fv6UvKQGFi2k"
export TELEGRAM_WEBHOOK_SECRET="some-long-random-secret"
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo"
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -d "url=https://pulse-zone.tech/api/integrations/telegram/webhook/${TELEGRAM_WEBHOOK_SECRET}/"
docker exec -it taskpulse-web env | grep TELEGRAM_WEBHOOK_SECRET


python manage.py flush
curl "http://localhost:8000/api/auth/verify-email/?token=92424c72-751b-4a0f-8fcd-457dc2619b1d"
from tasks.tasks_reminders import send_task_assigned_notification

send_task_assigned_notification.delay(999999)


python manage.py runserver 0.0.0.0:8000
celery -A TaskPulse worker -l info -P solo
celery -A TaskPulse beat -l info


from integrations.notifications import send_telegram_message
send_telegram_message(493089867, "Тестовое сообщение от Pulse-zone")


docker stop amnezia-xray amnezia-awg
mkdir -p /var/www/taskpulse_frontend
cp -r ~/opt/taskpulse/TaskPulse/taskpulse-frontend/dist/* /var/www/taskpulse_frontend/


echo ".env.prod" >> .gitignore
git rm -r --cached .
git commit -m "Remove .env.prod from repo and ignore it"
git push


grep -R "api/auth" -n src



