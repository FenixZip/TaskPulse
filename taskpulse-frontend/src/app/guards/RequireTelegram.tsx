// src/app/guards/RequireTelegram.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../../shared/hooks/useAuth";
import { useTelegramProfile } from "../../shared/hooks/useTelegramProfile";
import { ROUTES } from "../../shared/config/routes";

export const RequireTelegram = () => {
  const { auth } = useAuth();
  const location = useLocation();
  const {
    data: telegramProfile,
    isLoading,
    isError,
  } = useTelegramProfile();

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

  // Если случилась ошибка при запросе профиля Telegram —
  // считаем, что он не подтверждён.
  const telegramConfirmed = !!telegramProfile?.telegram_user_id;
  const isProfilePage = location.pathname.startsWith("/app/profile");

  // Если Telegram не подтверждён и мы НЕ на странице профиля —
  // отправляем пользователя в профиль, где есть блок привязки
  if ((!telegramConfirmed || isError) && !isProfilePage) {
    return <Navigate to="/app/profile" replace />;
  }

  // На /app/profile пускаем всегда (если залогинен),
  // чтобы пользователь мог привязать Telegram.
  return <Outlet />;
};
