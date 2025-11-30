// src/app/guards/RequireRole.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { UserRole } from "../../entities/user/model/types";
import { useAuth } from "../../shared/hooks/useAuth";
import { ROUTES } from "../../shared/config/routes";

interface RequireRoleProps {
  allowed: UserRole[];
}

export const RequireRole = ({ allowed }: RequireRoleProps) => {
  const { auth } = useAuth();
  const location = useLocation();

  if (!auth.token || !auth.user) {
    return (
      <Navigate
        to={ROUTES.login}
        replace
        state={{ from: location }}
      />
    );
  }

  if (!allowed.includes(auth.user.role)) {
    // роль не подходит → просто выбрасываем на логин
    return <Navigate to={ROUTES.login} replace />;
  }

  return <Outlet />;
};
