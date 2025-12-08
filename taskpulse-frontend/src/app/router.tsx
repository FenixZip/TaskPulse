// src/app/router.tsx
import { Routes, Route } from "react-router-dom";

import { RootLayout } from "./layouts/RootLayout";
import { DashboardLayout } from "./layouts/DashboardLayout";

import { RequireAuth } from "./guards/RequireAuth";

import { LandingPage } from "../pages/landing/LandingPage";

import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { ResetPasswordRequestPage } from "../pages/auth/ResetPasswordRequestPage";
import { AcceptInvitePage } from "../pages/auth/AcceptInvitePage";

import { DashboardHomePage } from "../pages/dashboard/DashboardHomePage";
import { ProfilePage } from "../pages/profile/ProfilePage";
import { TaskDetailsPage } from "../pages/tasks/TaskDetailsPage";
import { ConversationPage } from "../pages/chat/ConversationPage";
import { ErrorPage } from "../pages/error/ErrorPage";
import { NotFoundPage } from "../pages/error/NotFoundPage";

// новые страницы под вкладки
import { TasksPage } from "../pages/dashboard/TasksPage";
import { ExecutorsPage } from "../pages/dashboard/ExecutorsPage";
import { StatsPage } from "../pages/dashboard/StatsPage";

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<RootLayout />}>
        {/* публичная зона */}
        <Route index element={<LandingPage />} />

        <Route path="auth">
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route
            path="reset-password"
            element={<ResetPasswordRequestPage />}
          />
        </Route>

        {/* приём инвайта по ссылке из письма */}
        <Route path="invite">
          <Route path="accept" element={<AcceptInvitePage />} />
        </Route>

        {/* приватная зона */}
        <Route element={<RequireAuth />}>
          <Route path="app" element={<DashboardLayout />}>
            {/* главная страница /app — можно оставить как "домик" */}
            <Route index element={<DashboardHomePage />} />

            {/* вкладки */}
            <Route path="tasks" element={<TasksPage />} />
            <Route path="executors" element={<ExecutorsPage />} />
            <Route path="stats" element={<StatsPage />} />

            <Route path="profile" element={<ProfilePage />} />

            {/* детальная задача */}
            <Route path="tasks/:taskId" element={<TaskDetailsPage />} />

            {/* чат создатель ↔ исполнитель */}
            <Route path="chat/:userId" element={<ConversationPage />} />
          </Route>
        </Route>

        <Route path="error" element={<ErrorPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};
