// src/pages/auth/AcceptInvitePage.tsx
import { Navigate } from "react-router-dom";
import { AcceptInviteForm } from "../../features/auth/accept-invite/ui/AcceptInviteForm";
import { useAuth } from "../../shared/hooks/useAuth";
import { ROUTES } from "../../shared/config/routes";

export const AcceptInvitePage = () => {
  const { auth } = useAuth();

  // если уже залогинен — уходим в /app
  if (auth?.token) {
    return <Navigate to={ROUTES.appRoot} replace />;
  }

  return (
    <div className="auth-page">
      <AcceptInviteForm />
    </div>
  );
};
