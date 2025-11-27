// src/pages/dashboard/executor/ExecutorTasksPage.tsx
import { TasksList } from "../../../features/tasks/list/ui/TasksList";

export const ExecutorTasksPage = () => {
  return (
    <div>
      <h1 className="landing-title">Мои задачи</h1>
      <p className="landing-subtitle">
        Список задач, поставленных вам создателем.
      </p>
      <TasksList mode="executor" />
    </div>
  );
};
