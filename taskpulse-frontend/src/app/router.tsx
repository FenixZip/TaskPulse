// src/app/router.tsx
import { Routes, Route } from "react-router-dom";

import { RootLayout } from "./layouts/RootLayout";
import { DashboardLayout } from "./layouts/DashboardLayout";

import { RequireAuth } from "./guards/RequireAuth";
import { RequireRole } from "./guards/RequireRole";
import { RequireTelegram } from "./guards/RequireTelegram";

import { LandingPage } from "../pages/landing/LandingPage";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { ResetPasswordRequestPage } from "../pages/auth/ResetPasswordRequestPage";

import { ProfilePage } from "../pages/profile/ProfilePage";

import { CreatorDashboardPage } from "../pages/dashboard/creator/CreatorDashboardPage";
import { CreatorTasksPage } from "../pages/dashboard/creator/CreatorTasksPage";
import { CreatorTaskDetailsPage } from "../pages/dashboard/creator/CreatorTaskDetailsPage";
import { ExecutorsPage } from "../pages/dashboard/creator/ExecutorsPage";
import { ReportsPage } from "../pages/dashboard/creator/ReportsPage";

import { ExecutorDashboardPage } from "../pages/dashboard/executor/ExecutorDashboardPage";
import { ExecutorTasksPage } from "../pages/dashboard/executor/ExecutorTasksPage";
import { ExecutorTaskDetailsPage } from "../pages/dashboard/executor/ExecutorTaskDetailsPage";

import { ConversationPage } from "../pages/chat/ConversationPage";
import { ErrorPage } from "../pages/error/ErrorPage";
import { NotFoundPage } from "../pages/error/NotFoundPage";
import { DashboardHomePage } from "../pages/dashboard/DashboardHomePage";

export const AppRouter = () => {
  return (
    <Routes>
      {/* общий layout */}
      <Route path="/" element={<RootLayout />}>
        {/* лендинг */}
        <Route index element={<LandingPage />} />

        {/* AUTH-блок */}
        <Route path="auth">
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="reset-password" element={<ResetPasswordRequestPage />} />
        </Route>

        {/* всё, что ниже, защищаем RequireAuth */}
        <Route element={<RequireAuth />}>
          {/* приватная зона /app с dashboard-лейаутом */}
          <Route path="app" element={<DashboardLayout />}>
            {/* /app — просто домашняя страница дашборда, БЕЗ Navigate */}
            <Route index element={<DashboardHomePage />} />

            {/* профиль доступен всем авторизованным */}
            <Route path="profile" element={<ProfilePage />} />

            {/* блок создателя */}
            <Route element={<RequireRole allowed={["creator"]} />}>
              <Route
                path="creator/dashboard"
                element={<CreatorDashboardPage />}
              />
              <Route path="creator/tasks" element={<CreatorTasksPage />} />
              <Route
                path="creator/tasks/:taskId"
                element={<CreatorTaskDetailsPage />}
              />
              <Route path="creator/executors" element={<ExecutorsPage />} />
              <Route path="creator/reports" element={<ReportsPage />} />
            </Route>

            {/* блок исполнителя */}
            <Route element={<RequireRole allowed={["executor"]} />}>
              <Route
                path="executor/dashboard"
                element={<ExecutorDashboardPage />}
              />
              <Route path="executor/tasks" element={<ExecutorTasksPage />} />
              <Route
                path="executor/tasks/:taskId"
                element={<ExecutorTaskDetailsPage />}
              />
            </Route>

            {/* чат — только при привязанном Telegram */}
            <Route element={<RequireTelegram />}>
              <Route path="chat/:userId" element={<ConversationPage />} />
            </Route>
          </Route>
        </Route>

        {/* страница ошибки */}
        <Route path="error" element={<ErrorPage />} />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};
