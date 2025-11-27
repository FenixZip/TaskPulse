// src/app/router.tsx
import { Routes, Route } from "react-router-dom";
import { RootLayout } from "./layouts/RootLayout";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { ROUTES } from "../shared/config/routes";

import { LandingPage } from "../pages/landing/LandingPage";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";

import { RequireAuth } from "./guards/RequireAuth";
import { RequireRole } from "./guards/RequireRole";
import { RequireTelegram } from "./guards/RequireTelegram";

import { CreatorTasksPage } from "../pages/dashboard/creator/CreatorTasksPage";
import { ExecutorTasksPage } from "../pages/dashboard/executor/ExecutorTasksPage";
import { AppRootRedirect } from "../pages/dashboard/AppRootRedirect";
import { ProfilePage } from "../pages/profile/ProfilePage";

export const AppRouter = () => {
  return (
    <Routes>
      {/* Общий layout с шапкой/футером */}
      <Route path={ROUTES.landing} element={<RootLayout />}>
        {/* главная */}
        <Route index element={<LandingPage />} />

        {/* auth */}
        <Route path="auth/login" element={<LoginPage />} />
        <Route path="auth/register" element={<RegisterPage />} />

        {/* приватная зона приложения */}
        <Route path="app" element={<RequireAuth />}>
          <Route element={<DashboardLayout />}>
            {/* /app -> редирект по роли */}
            <Route index element={<AppRootRedirect />} />

            {/* личный кабинет всегда доступен */}
            <Route path="profile" element={<ProfilePage />} />

            {/* всё, что связано с задачами, требует подтверждённый Telegram */}
            <Route element={<RequireTelegram />}>
              <Route element={<RequireRole allowed={["creator"]} />}>
                <Route path="creator/tasks" element={<CreatorTasksPage />} />
              </Route>

              <Route element={<RequireRole allowed={["executor"]} />}>
                <Route path="executor/tasks" element={<ExecutorTasksPage />} />
              </Route>
            </Route>
          </Route>
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<div>Страница не найдена</div>} />
    </Routes>
  );
};
