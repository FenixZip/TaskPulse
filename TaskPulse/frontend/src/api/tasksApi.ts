// @ts-nocheck
import { apiClient } from "./client";

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;   // "new" | "in_progress" | "done" | "overdue"
  priority: string; // "low" | "medium" | "high"
  assignee: number | null;
  assignee_name?: string;
  due_at: string | null;

  // Эти поля появятся, если ты добавишь их в TaskSerializer на бэке:
  creator_name?: string;        // ФИО создателя (для исполнителя)
  result_file?: string | null;  // URL файла, который прикрепил исполнитель
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  priority: string;     // "low" | "medium" | "high"
  assignee: number;     // id исполнителя
  due_at: string | null;
  file?: File | null;   // файл при создании задачи (от создателя)
}

/** Список задач с фильтрами */
export async function fetchTasks(params?: Record<string, any>) {
  const response = await apiClient.get<Task[]>("/tasks/", { params });
  return response.data;
}

/** Создание задачи (Создатель, с возможностью прикрепить файл) */
export async function createTask(payload: CreateTaskPayload) {
  const formData = new FormData();
  formData.append("title", payload.title);
  if (payload.description) formData.append("description", payload.description);
  formData.append("priority", payload.priority);
  formData.append("assignee", String(payload.assignee));
  if (payload.due_at) formData.append("due_at", payload.due_at);
  if (payload.file) formData.append("attachment", payload.file); // имя поля подправь под сериализатор

  const response = await apiClient.post<Task>("/tasks/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

/** Исполнитель отмечает задачу как выполненную */
export async function completeTask(taskId: number) {
  const response = await apiClient.patch<Task>(`/tasks/${taskId}/`, {
    status: "done",
  });
  return response.data;
}

/** Исполнитель прикрепляет файл к задаче */
export async function uploadTaskResult(taskId: number, file: File) {
  const formData = new FormData();
  // имя поля 'result_file' должно совпадать с полем в модели/сериализаторе
  formData.append("result_file", file);

  const response = await apiClient.patch<Task>(`/tasks/${taskId}/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}
