import { useQuery } from "@tanstack/react-query";
import { getTasks } from "../../../../entities/task/model/api";
import type { Task } from "../../../../entities/task/model/types";

// Аналогично для исполнителя – берём задачи, доступные ему по API
export const useExecutorTasks = () => {
  return useQuery<Task[], Error>({
    queryKey: ["tasks", "executor"],
    queryFn: async () => {
      const tasks = await getTasks();
      return tasks;
    },
  });
};
