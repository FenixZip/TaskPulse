// src/app/guards/RequireTelegram.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";

import { useAuth } from "../../shared/hooks/useAuth";
import { ROUTES } from "../../shared/config/routes";
import { useTelegramProfile } from "../../shared/hooks/useTelegramProfile";
import { getTelegramConnectLink } from "../../entities/integrations/model/telegramApi";

export const RequireTelegram = () => {
  const { auth } = useAuth();
  const { data: tgProfile, isLoading } = useTelegramProfile();
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // если не залогинен — обычный редирект на логин
  if (!auth?.user || !auth.token) {
    return <Navigate to={ROUTES.login} replace />;
  }

  useEffect(() => {
    if (isLoading || redirecting) return;

    // если Telegram ещё не привязан → запрашиваем ссылку и уходим в бота
    if (tgProfile === null) {
      setRedirecting(true);
      getTelegramConnectLink()
        .then((link) => {
          window.location.href = link;
        })
        .catch(() => {
          setError("Не удалось получить ссылку на Telegram-бота.");
          setRedirecting(false);
        });
    }
  }, [isLoading, tgProfile, redirecting]);

  // пока проверяем/редиректим — ничего из приложения не показываем
  if (isLoading || redirecting || tgProfile === null) {
    return (
      <div className="page-centered">
        <div className="auth-card">
          <h1 className="auth-title">Привязка Telegram</h1>
          <p className="auth-subtitle">
            Мы отправляем вас в Telegram-бота Pulse-zone, чтобы привязать
            аккаунт. После привязки вернитесь в браузер и обновите страницу.
          </p>
          {error && (
            <p className="text-xs text-red-400" style={{ marginTop: "8px" }}>
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Telegram-профиль есть → пускаем дальше
  return <Outlet />;
};
