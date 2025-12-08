// src/app/guards/RequireTelegram.tsx
import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../../shared/hooks/useAuth";
import { ROUTES } from "../../shared/config/routes";
import { useTelegramProfile } from "../../shared/hooks/useTelegramProfile";

export const RequireTelegram = () => {
  const { auth } = useAuth();
  const { data: telegramProfile, isLoading } = useTelegramProfile();

  // Не залогинен -> на страницу логина
  if (!auth?.user || !auth.token) {
    return <Navigate to={ROUTES.login} replace />;
  }

  // Пока узнаём статус Telegram — показываем заглушку
  if (isLoading) {
    return (
      <div className="page-centered">
        <div className="auth-card">
          <h1 className="auth-title">Привязка Telegram</h1>
          <p className="auth-subtitle">
            Проверяем, привязан ли ваш Telegram-аккаунт…
          </p>
        </div>
      </div>
    );
  }

  // Telegram не привязан -> отправляем в профиль,
  // где есть кнопка «Привязать Telegram»
  if (!telegramProfile) {
    return <Navigate to={ROUTES.profile} replace />;
  }

  // Всё ок — пускаем дальше
  return <Outlet />;
};
