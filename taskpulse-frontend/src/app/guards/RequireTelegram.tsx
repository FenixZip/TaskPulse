// src/app/guards/RequireTelegram.tsx
import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../../shared/hooks/useAuth";
import { useTelegramProfile } from "../../shared/hooks/useTelegramProfile";
import { ROUTES } from "../../shared/config/routes";

export const RequireTelegram = () => {
  const { auth } = useAuth();
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

  // В случае ошибки подстрахуемся и отправим на профиль,
  // там пользователь сможет инициировать привязку ещё раз
  if (isError) {
    return <Navigate to="/app/profile" replace />;
  }

  // Telegram считаем подтверждённым только если есть реальный ID
  const telegramConfirmed = !!telegramProfile?.telegram_user_id;

  // Telegram не привязан/не подтверждён -> отправляем на страницу профиля,
  // где есть блок с привязкой и кнопкой «Привязать/обновить Telegram»
  if (!telegramConfirmed) {
    return <Navigate to="/app/profile" replace />;
  }

  // Всё ок — пускаем дальше
  return <Outlet />;
};
