// src/pages/dashboard/TasksPage.tsx
import { useState } from "react";
import { useAuth } from "../../shared/hooks/useAuth";
import { TasksList } from "../../features/tasks/list/ui/TasksList";
import { CreateTaskModal } from "../../features/tasks/create-task/ui/CreateTaskModal";

type NormalizedRole = "creator" | "executor" | null;

const normalizeRole = (value: string | null | undefined): NormalizedRole => {
  if (!value) return null;
  if (value === "CREATOR" || value === "creator") return "creator";
  if (value === "EXECUTOR" || value === "executor") return "executor";
  return null;
};

export const TasksPage = () => {
  const { auth } = useAuth();
  const role = normalizeRole(auth.user?.role);

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  if (!role) {
    return (
      <div className="page">
        <h1 className="page-title">Задачи</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-xl">
          Ваша роль ещё не определена. Пожалуйста, обновите страницу или войдите
          заново.
        </p>
      </div>
    );
  }

  if (role === "creator") {
    return (
      <div className="page">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="page-title">Задачи</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-xl">
              Управляйте задачами для исполнителей, используйте фильтры и
              назначайте новые задачи.
            </p>
          </div>
          <button
            type="button"
            className="app-nav-link app-nav-link-primary"
            onClick={() => setIsCreateOpen(true)}
          >
            + Назначить задачу
          </button>
        </div>

        <div className="mt-4">
          <TasksList mode="creator" />
        </div>

        <CreateTaskModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          assigneeId={null}
          assigneeName={null}
        />
      </div>
    );
  }

  // executor
  return (
    <div className="page">
      <h1 className="page-title">Мои задачи</h1>
      <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-xl">
        Здесь вы видите задачи, которые вам поставили. Меняйте статус и
        уточняйте детали с создателем.
      </p>

      <div className="mt-4">
        <TasksList mode="executor" />
      </div>
    </div>
  );
};
