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

  // если пользователь не залогинен или нет токена — на логин
  if (!auth?.user || !auth.token) {
    return <Navigate to={ROUTES.login} replace />;
  }

  // здесь TypeScript уже знает, что токен точно есть
  const token = auth.token as string;

  useEffect(() => {
    if (isLoading || redirected) return;

    // если Telegram ещё не привязан → отправляем в connect-эндпоинт
    if (tgProfile === null) {
      setRedirected(true);

      const qs = new URLSearchParams({ token }).toString();

      // backend (telegram_connect_start) по этому токену найдёт пользователя
      // и сделает redirect в https://t.me/<bot>?start=<link_token>
      window.location.href = `/api/integrations/telegram/connect/?${qs}`;
    }
  }, [isLoading, tgProfile, redirected, token]);

  // пока проверяем / делаем редирект — показываем заглушку
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

  // Telegram-профиль есть → пускаем дальше
  return <Outlet />;
};
