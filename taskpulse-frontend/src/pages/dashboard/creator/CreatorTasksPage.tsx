// src/pages/dashboard/creator/CreatorTasksPage.tsx
import { TasksList } from "../../../features/tasks/list/ui/TasksList";

export const CreatorTasksPage = () => {
  return (
    <div>
      <h1 className="landing-title">Задачи</h1>
      <p className="landing-subtitle">
        Список задач, назначенных исполнителям вашей команды.
      </p>
      <TasksList mode="creator" />
    </div>
  );
};
