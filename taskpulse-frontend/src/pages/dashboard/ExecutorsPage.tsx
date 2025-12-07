// src/pages/dashboard/ExecutorsPage.tsx
import { useAuth } from "../../shared/hooks/useAuth";
import { InviteExecutorForm } from "../../features/users-management/invite-executor/ui/InviteExecutorForm";
import { ExecutorsTable } from "../../features/users-management/executors-list/ui/ExecutorsTable";

type NormalizedRole = "creator" | "executor" | null;

const normalizeRole = (value: string | null | undefined): NormalizedRole => {
  if (!value) return null;
  if (value === "CREATOR" || value === "creator") return "creator";
  if (value === "EXECUTOR" || value === "executor") return "executor";
  return null;
};

export const ExecutorsPage = () => {
  const { auth } = useAuth();
  const role = normalizeRole(auth.user?.role);

  if (role !== "creator") {
    return (
      <div className="page">
        <h1 className="page-title">Исполнители</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-xl">
          Раздел доступен только создателям задач.
        </p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="page-title">Исполнители</h1>
      <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-xl">
        Управляйте командой, приглашайте исполнителей и назначайте им задачи.
      </p>

      <div className="mt-4 space-y-4 max-w-3xl">
        <InviteExecutorForm />
        <ExecutorsTable />
      </div>
    </div>
  );
};
