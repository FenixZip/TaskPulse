import { Route, Routes, Navigate } from "react-router-dom";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { TasksPage } from "../pages/TasksPage";
import { AppLayout } from "../components/layout/AppLayout";
import { LandingPage } from "../pages/LandingPage";
import { isAuthenticated } from "../api/auth";

function RequireAuth({ children }: { children: JSX.Element }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export function AppRouter() {
  return (
    <Routes>
      {/* публичная главная */}
      <Route path="/" element={<LandingPage />} />

      {/* логин и регистрация */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* закрытая зона */}
      <Route
        path="/app"
        element={
          <RequireAuth>
            <AppLayout>
              <TasksPage />
            </AppLayout>
          </RequireAuth>
        }
      />

      {/* всё остальное → на главную */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
