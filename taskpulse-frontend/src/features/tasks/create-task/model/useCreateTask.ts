// src/features/tasks/create/model/useCreateTask.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../../shared/lib/apiClient";
import type { Task } from "../../../../entities/task/model/types";

export interface CreateTaskPayload {
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  assignee: number;        // id исполнителя
  due_at?: string | null;  // ISO-строка, можно null
}

const createTaskRequest = async (
  payload: CreateTaskPayload,
): Promise<Task> => {
  const { data } = await apiClient.post<Task>("/api/tasks/", payload);
  return data;
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTaskRequest,
    onSuccess: () => {
      // обновляем список задач у создателя и у исполнителя
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
};
