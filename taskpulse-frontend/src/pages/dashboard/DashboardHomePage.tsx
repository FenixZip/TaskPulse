// src/pages/dashboard/DashboardHomePage.tsx
import { useState } from "react";
import { useAuth } from "../../shared/hooks/useAuth";
import { TasksList } from "../../features/tasks/list/ui/TasksList";
import { InviteExecutorForm } from "../../features/users-management/invite-executor/ui/InviteExecutorForm";
import { ExecutorsTable } from "../../features/users-management/executors-list/ui/ExecutorsTable";

type Tab = "tasks" | "executors";
type NormalizedRole = "creator" | "executor" | null;

// Нормализация роли, которая приходит с бэка (CREATOR/EXECUTOR)
const normalizeRole = (value: string | null | undefined): NormalizedRole => {
  if (!value) return null;
  if (value === "CREATOR" || value === "creator") return "creator";
  if (value === "EXECUTOR" || value === "executor") return "executor";
  return null;
};

export const DashboardHomePage = () => {
  const { auth } = useAuth();
  const rawRole = auth.user?.role ?? null;
  const role = normalizeRole(rawRole);

  const [activeTab, setActiveTab] = useState<Tab>("tasks");

  // Когда роль ещё не определена — просто приветствие
  if (!role) {
    return (
      <div className="page">
        <h1 className="page-title">Добро пожаловать в Pulse-zone</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-xl">
          Вы вошли в систему. Выберите раздел слева, чтобы перейти к задачам или
          профилю.
        </p>
      </div>
    );
  }

  // ---------- СОЗДАТЕЛЬ ----------
  if (role === "creator") {
    return (
      <div className="page">
        <h1 className="page-title">Задачи и исполнители</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-xl">
          Здесь вы видите задачи для исполнителей и управляете командой.
        </p>

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

        <div className="mt-4">
          {activeTab === "tasks" ? (
            // Вкладка "Задачи": только список задач создателя
            <TasksList mode="creator" />
          ) : (
            // Вкладка "Исполнители": форма приглашения + таблица
            <div className="space-y-4">
              <InviteExecutorForm />
              <ExecutorsTable />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---------- ИСПОЛНИТЕЛЬ ----------
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
