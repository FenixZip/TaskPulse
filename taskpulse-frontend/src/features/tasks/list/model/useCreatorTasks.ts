import { useQuery } from "@tanstack/react-query";
import { getTasks } from "../../../../entities/task/model/api";
import type { Task } from "../../../../entities/task/model/types";

// Для создателя пока просто берём все задачи,
// бэкенд и так вернёт только его задачи/задачи с его участием.
export const useCreatorTasks = () => {
  return useQuery<Task[], Error>({
    queryKey: ["tasks", "creator"],
    queryFn: async () => {
      const tasks = await getTasks();
      return tasks;
    },
  });
};
