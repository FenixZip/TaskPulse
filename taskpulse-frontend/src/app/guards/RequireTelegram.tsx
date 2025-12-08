// src/app/guards/RequireTelegram.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";

import { useAuth } from "../../shared/hooks/useAuth";
import { ROUTES } from "../../shared/config/routes";
import { useTelegramProfile } from "../../shared/hooks/useTelegramProfile";

export const RequireTelegram = () => {
  const { auth } = useAuth();
  const { data: tgProfile, isLoading } = useTelegramProfile();
  const [redirected, setRedirected] = useState(false);

  // если пользователь не залогинен — обычный редирект на логин
  if (!auth?.user || !auth.token) {
    return <Navigate to={ROUTES.login} replace />;
  }

  useEffect(() => {
    // пока идёт запрос профиля или уже совершали редирект — ничего не делаем
    if (isLoading || redirected) return;

    // если Telegram ещё не привязан → отправляем в /api/integrations/telegram/connect/
    if (tgProfile === null) {
      setRedirected(true);
      // Браузер делает GET-запрос, а дальше backend уже редиректит в Telegram-бота
      window.location.href = "/api/integrations/telegram/connect/";
    }
  }, [isLoading, tgProfile, redirected]);

  // пока проверяем/редиректим — показываем заглушку «Привязка Telegram»
  if (isLoading || tgProfile === null || redirected) {
    return (
      <div className="page-centered">
        <div className="auth-card">
          <h1 className="auth-title">Привязка Telegram</h1>
          <p className="auth-subtitle">
            Мы отправляем вас в Telegram-бота Pulse-zone, чтобы привязать
            аккаунт. После привязки вернитесь в браузер и обновите страницу.
          </p>
        </div>
      </div>
    );
  }

  // Telegram-профиль есть → пускаем дальше в /app/*
  return <Outlet />;
};
