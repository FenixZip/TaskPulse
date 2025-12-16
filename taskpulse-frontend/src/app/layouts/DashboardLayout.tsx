// src/pages/dashboard/DashboardLayout.tsx
import { Outlet } from "react-router-dom";
import { ExecutorsChatDock } from "../../features/users-management/executors-list/ui/ExecutorsChatDock";

export const DashboardLayout = () => {
  return (
    <div className="dashboard-inner">
      {/* 1) Dock-чат рендерим первым: он глобальный UI и не должен зависеть от страниц */}
      <ExecutorsChatDock />

      {/* 2) Дальше контент страниц /app/... */}
      <Outlet />
    </div>
  );
};
