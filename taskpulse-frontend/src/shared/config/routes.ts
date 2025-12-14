// src/shared/config/routes.ts

export const ROUTES = {
  landing: "/",
  login: "/auth/login",
  register: "/auth/register",
  resetPasswordRequest: "/auth/reset-password",

  // новая страница приёма инвайта
  acceptInvite: "/invite/accept",

  appRoot: "/app",
  connectTelegram: "/app/connect-telegram",


  // Вкладки в шапке
  tasks: "/app/tasks",
  executors: "/app/executors",
  stats: "/app/stats",

  // Старые алиасы — теперь ведут на общий список задач
  creatorDashboard: "/app/tasks",
  executorDashboard: "/app/tasks",
} as const;
