// src/app/guards/RequireTelegram.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../../shared/hooks/useAuth";
import { useTelegramProfile } from "../../shared/hooks/useTelegramProfile";
import { ROUTES } from "../../shared/config/routes";

export const RequireTelegram = () => {
  const { auth } = useAuth();
  const location = useLocation();
  const { data: telegramProfile, isLoading, isError } = useTelegramProfile();

  // Не залогинен -> отправляем на логин
  if (!auth?.user || !auth.token) {
    return <Navigate to={ROUTES.login} replace />;
  }

  // Пока грузим статус Telegram
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-sm text-muted-foreground">
          Загрузка статуса Telegram...
        </div>
      </div>
    );
  }

  const telegramConfirmed = !!telegramProfile?.telegram_user_id;
  const isConnectTelegramPage = location.pathname.startsWith(ROUTES.connectTelegram);

  // Если Telegram не подтверждён (или ошибка) и мы НЕ на странице подключения —
  // отправляем на обязательный шаг подключения.
  if ((!telegramConfirmed || isError) && !isConnectTelegramPage) {
    return (
      <Navigate
        to={ROUTES.connectTelegram}
        replace
        state={{ from: location }}
      />
    );
  }

  // На странице подключения Telegram пускаем всегда (если залогинен)
  return <Outlet />;
};
