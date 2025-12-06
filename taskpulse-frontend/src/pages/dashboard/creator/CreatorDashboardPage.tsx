// src/pages/dashboard/creator/CreatorTasksPage.tsx
import { useState } from "react";
import { TasksList } from "../../../features/tasks/list/ui/TasksList";
import { InviteExecutorForm } from "../../../features/users-management/invite-executor/ui/InviteExecutorForm";
import { ExecutorsTable } from "../../../features/users-management/executors-list/ui/ExecutorsTable";

type Tab = "tasks" | "executors";

export const CreatorTasksPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>("tasks");

  return (
    <div className="dashboard-page">
      <header>
        <h1 className="dashboard-header-title">Задачи и исполнители</h1>
        <p className="dashboard-header-subtitle">
          Здесь вы видите задачи для исполнителей и управляете своей командой.
        </p>
      </header>

      {/* Приглашение исполнителя по e-mail */}
      <div className="mt-6">
        <InviteExecutorForm />
      </div>

      {/* Вкладки: Задачи / Исполнители */}
      <div className="dashboard-tabs">
        <button
          type="button"
          className={
            "dashboard-tab" +
            (activeTab === "tasks" ? " dashboard-tab--active" : "")
          }
          onClick={() => setActiveTab("tasks")}
        >
          Задачи
        </button>
        <button
          type="button"
          className={
            "dashboard-tab" +
            (activeTab === "executors" ? " dashboard-tab--active" : "")
          }
          onClick={() => setActiveTab("executors")}
        >
          Исполнители
        </button>
      </div>

      {/* Контент вкладок */}
      <section className="dashboard-section">
        {activeTab === "tasks" ? (
          <>
            <h2 className="dashboard-section-title">Задачи</h2>
            {/* Список задач, которые создатель поставил исполнителям */}
            <TasksList mode="creator" />
          </>
        ) : (
          <>
            <h2 className="dashboard-section-title">Исполнители</h2>
            {/* Список исполнителей + кнопка «Назначить задачу» */}
            <ExecutorsTable />
          </>
        )}
      </section>
    </div>
  );
};
