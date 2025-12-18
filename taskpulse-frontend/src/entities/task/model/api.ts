// src/entities/task/model/api.ts
import { apiClient } from "../../../shared/lib/apiClient";
import type { Task, TaskStatus } from "./types";

export const getTasks = async (): Promise<Task[]> => {
  const { data } = await apiClient.get<Task[]>("/api/tasks/");
  return data;
};

export const updateTaskStatus = async (params: {
  taskId: number;
  status: TaskStatus;
}): Promise<Task> => {
  const { taskId, status } = params;
  const { data } = await apiClient.patch<Task>(`/tasks/${taskId}/`, {
    status,
  });
  return data;
};
