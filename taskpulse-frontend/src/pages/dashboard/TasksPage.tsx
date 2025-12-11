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
          Ваша роль ещё не определена. Пожалуйста, обновите страницу или
          войдите заново.
        </p>
      </div>
    );
  }

  if (role === "creator") {
    return (
      <div className="page">
        <div className="tasks-header">
          <div className="tasks-header-title-row">
            <h1 className="page-title">Задачи</h1>
            <button
              type="button"
              className="tasks-add-button"
              onClick={() => setIsCreateOpen(true)}
              aria-label="Назначить задачу"
            >
              +
            </button>
          </div>
          <p className="tasks-header-subtitle">
            Управляйте задачами для исполнителей и назначайте новые.
          </p>
        </div>

        <TasksList mode="creator" />

        {/* Модалка создания задачи */}
        <CreateTaskModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          assigneeId={null}
        />
      </div>
    );
  }

  // executor
  return (
    <div className="page">
      <h1 className="page-title">Мои задачи</h1>
      <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-xl mx-auto text-center">
        Здесь вы видите задачи, которые вам поставили. Меняйте статус и
        уточняйте детали с создателем.
      </p>

      <TasksList mode="executor" />
    </div>
  );
};
