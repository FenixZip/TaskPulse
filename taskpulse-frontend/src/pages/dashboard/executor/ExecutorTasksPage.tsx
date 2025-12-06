// src/pages/dashboard/executor/ExecutorTasksPage.tsx
import { TasksList } from "../../../features/tasks/list/ui/TasksList";

export const ExecutorTasksPage = () => {
  return (
    <div className="dashboard-page">
      <header>
        <h1 className="dashboard-header-title">Мои задачи</h1>
        <p className="dashboard-header-subtitle">
          Список задач, поставленных вам создателем.
        </p>
      </header>

      <section className="dashboard-section">
        <TasksList mode="executor" />
      </section>
    </div>
  );
};
