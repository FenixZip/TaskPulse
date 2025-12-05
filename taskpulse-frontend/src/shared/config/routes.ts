// src/shared/config/routes.ts

export const ROUTES = {
  landing: "/",
  login: "/auth/login",
  register: "/auth/register",
  resetPasswordRequest: "/auth/reset-password",

  appRoot: "/app",
  creatorDashboard: "/app/creator/tasks",
  executorDashboard: "/app/executor/tasks",
} as const;
