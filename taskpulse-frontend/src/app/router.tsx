// src/app/router.tsx
import { Routes, Route } from "react-router-dom";

import { RootLayout } from "./layouts/RootLayout";
import { DashboardLayout } from "./layouts/DashboardLayout";

import { RequireAuth } from "./guards/RequireAuth";
import { RequireTelegram } from "./guards/RequireTelegram";

import { LandingPage } from "../pages/landing/LandingPage";

import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { ResetPasswordRequestPage } from "../pages/auth/ResetPasswordRequestPage";
import { AcceptInvitePage } from "../pages/auth/AcceptInvitePage";

import { DashboardHomePage } from "../pages/dashboard/DashboardHomePage";
import { TasksPage } from "../pages/dashboard/TasksPage";
import { ExecutorsPage } from "../pages/dashboard/ExecutorsPage";
import { StatsPage } from "../pages/dashboard/StatsPage";
import { AppRootRedirect } from "../pages/dashboard/AppRootRedirect";

import { ProfilePage } from "../pages/profile/ProfilePage";

import { TaskDetailsPage } from "../pages/tasks/TaskDetailsPage";

import { ConversationPage } from "../pages/chat/ConversationPage";

import { ErrorPage } from "../pages/error/ErrorPage";
import { NotFoundPage } from "../pages/error/NotFoundPage";

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
          {/* если потом захочешь сделать confirm/verify-email —
              просто добавим сюда ещё роуты */}
        </Route>

        {/* ссылка из email-приглашения */}
        <Route path="invite">
          <Route path="accept" element={<AcceptInvitePage />} />
        </Route>

        {/* приватная зона */}
        <Route element={<RequireAuth />}>
          {/* всё приложение требует привязанный Telegram */}
          <Route element={<RequireTelegram />}>
            <Route path="app" element={<DashboardLayout />}>
              {/* /app → редирект по роли (creator/executor) */}
              <Route index element={<AppRootRedirect />} />

              {/* Дашборд как отдельная страница, если нужно */}
              <Route path="home" element={<DashboardHomePage />} />

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
        </Route>

        <Route path="error" element={<ErrorPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};
