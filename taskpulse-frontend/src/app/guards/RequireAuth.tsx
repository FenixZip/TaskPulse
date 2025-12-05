// src/app/guards/RequireAuth.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../shared/hooks/useAuth";
import { ROUTES } from "../../shared/config/routes";

export const RequireAuth = () => {
  const { auth } = useAuth();
  const location = useLocation();

  if (!auth?.token) {
    return (
      <Navigate
        to={ROUTES.login}
        state={{ from: location }}
        replace
      />
    );
  }

  return <Outlet />;
};
