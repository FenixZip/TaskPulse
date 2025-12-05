import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../shared/hooks/useAuth";
import { ROUTES } from "../../shared/config/routes";

export const RequireTelegram = () => {
  const { auth } = useAuth();

  if (!auth?.user) {
    return <Navigate to={ROUTES.login} replace />;
  }

  // предполагаю, что в user есть флаг/поле типа telegram_connected
  const tgOk =
    (auth.user as any).telegram_connected ??
    (auth.user as any).telegram_id ??
    false;

  if (!tgOk) {
    // нет телеграма → отправляем в профиль привязать
    return <Navigate to="/app/profile" replace />;
  }

  return <Outlet />;
};
