import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { MainLayout } from "./components/Layout/MainLayout";

// auth
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { VerifyEmailPage } from "./pages/auth/VerifyEmailPage";
import { PasswordResetConfirmPage } from "./pages/auth/PasswordResetConfirmPage";

// profile
import { ProfilePage } from "./pages/profile/ProfilePage";

// tasks
import { TasksListPage } from "./pages/tasks/TasksListPage";
import { TaskDetailPage } from "./pages/tasks/TaskDetailPage";

// cabinet
import { CreatorTasksPage } from "./pages/cabinet/CreatorTasksPage";
import { ExecutorTasksPage } from "./pages/cabinet/ExecutorTasksPage";

// reports
import { MonthlyReportPage } from "./pages/reports/MonthlyReportPage";

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* публичные страницы */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route
            path="/reset-password"
            element={<PasswordResetConfirmPage />}
          />

          {/* защищённые — всё, что под MainLayout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <TasksListPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/tasks/:id"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <TaskDetailPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/cabinet/creator"
            element={
              <ProtectedRoute allowedRoles={["CREATOR"]}>
                <MainLayout>
                  <CreatorTasksPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/cabinet/executor"
            element={
              <ProtectedRoute allowedRoles={["EXECUTOR"]}>
                <MainLayout>
                  <ExecutorTasksPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports/monthly"
            element={
              <ProtectedRoute allowedRoles={["CREATOR"]}>
                <MainLayout>
                  <MonthlyReportPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ProfilePage />
                </MainLayout>
              </ProtectedRoute>
            }
          />


        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
