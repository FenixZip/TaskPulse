// src/pages/dashboard/AppRootRedirect.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../../shared/hooks/useAuth";
import { ROUTES } from "../../shared/config/routes";

export const AppRootRedirect = () => {
  const { auth } = useAuth();

  if (!auth.user) {
    return <Navigate to={ROUTES.login} replace />;
  }

  return auth.user.role === "creator" ? (
    <Navigate to={ROUTES.creatorDashboard} replace />
  ) : (
    <Navigate to={ROUTES.executorDashboard} replace />
  );
};
