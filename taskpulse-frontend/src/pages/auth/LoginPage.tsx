// src/pages/auth/LoginPage.tsx
import { Navigate } from "react-router-dom";
import { LoginForm } from "../../features/auth/login/ui/LoginForm";
import { useAuth } from "../../shared/hooks/useAuth";
import { ROUTES } from "../../shared/config/routes";

export const LoginPage = () => {
  const { auth } = useAuth();

  // Если уже залогинен – сразу в /app,
  // дальше сработает AppRootRedirect и разведёт по ролям.
  if (auth?.token) {
    return <Navigate to={ROUTES.appRoot} replace />;
  }

  return (
    <div className="auth-page">
      <LoginForm />
    </div>
  );
};
