// src/app/layouts/DashboardLayout.tsx
import { Outlet } from "react-router-dom";

export const DashboardLayout = () => {
  return (
    <div className="dashboard-inner">
      <Outlet />
    </div>
  );
};
