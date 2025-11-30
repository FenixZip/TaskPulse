// src/pages/dashboard/creator/CreatorTasksPage.tsx
import { useState } from "react";
import { TasksList } from "../../../features/tasks/list/ui/TasksList";
import { InviteExecutorForm } from "../../../features/users-management/invite-executor/ui/InviteExecutorForm";
import { ExecutorsTable } from "../../../features/users-management/executors-list/ui/ExecutorsTable";

type Tab = "tasks" | "executors";

export const CreatorTasksPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>("tasks");

  return (
    <div className="page">
      <h1 className="landing-title">Панель создателя</h1>
      <p className="landing-subtitle">
        Здесь вы видите задачи для исполнителей и управляете своей командой.
      </p>

      {/* Приглашение исполнителя по e-mail */}
      <div className="mt-6">
        <InviteExecutorForm />
      </div>

      {/* Вкладки: Задачи / Исполнители */}
      <div className="mt-6 flex gap-4 border-b border-[var(--border-subtle)] text-sm">
        <button
          type="button"
          className={`px-3 py-2 -mb-px border-b-2 transition-colors ${
            activeTab === "tasks"
              ? "border-[var(--accent)] text-[var(--text-primary)]"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
          onClick={() => setActiveTab("tasks")}
        >
          Задачи
        </button>
        <button
          type="button"
          className={`px-3 py-2 -mb-px border-b-2 transition-colors ${
            activeTab === "executors"
              ? "border-[var(--accent)] text-[var(--text-primary)]"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
          onClick={() => setActiveTab("executors")}
        >
          Исполнители
        </button>
      </div>

      {/* Контент вкладок */}
      <div className="mt-4">
        {activeTab === "tasks" ? (
          // Список задач, которые создатель поставил исполнителям
          <TasksList mode="creator" />
        ) : (
          // Список исполнителей + кнопка «Назначить задачу»
          <ExecutorsTable />
        )}
      </div>
    </div>
  );
};
