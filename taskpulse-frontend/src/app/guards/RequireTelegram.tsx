// src/app/guards/RequireTelegram.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useTelegramProfile } from "../../shared/hooks/useTelegramProfile";

export const RequireTelegram = () => {
  const { data, isLoading, isError } = useTelegramProfile();
  const location = useLocation();

  if (isLoading) {
    return <div className="tasks-empty">Проверяем подключение Telegram…</div>;
  }

  // если телеграм не привязан — отправляем в личный кабинет
  if (!data || isError) {
    return (
      <Navigate
        to="/app/profile"
        replace
        state={{ from: location }}
      />
    );
  }

  return <Outlet />;
};
