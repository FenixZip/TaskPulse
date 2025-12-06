// src/app/layouts/DashboardLayout.tsx
import { Outlet } from "react-router-dom";
import { TaskChat } from "../../features/chat/task-chat/ui/TaskChat";

export const DashboardLayout = () => {
  return (
    <div className="dashboard-inner">
      <Outlet />

      {/* плавающий чат доступен на всех приватных страницах /app */}
      <TaskChat />
    </div>
  );
};
