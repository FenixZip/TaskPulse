// src/pages/dashboard/DashboardLayout.tsx
import { Outlet } from "react-router-dom";
import { ExecutorsChatDock } from "../../features/users-management/executors-list/ui/ExecutorsChatDock";

export const DashboardLayout = () => {
  return (
    <div className="dashboard-inner">
      <Outlet />
      <ExecutorsChatDock />
    </div>
  );
};
