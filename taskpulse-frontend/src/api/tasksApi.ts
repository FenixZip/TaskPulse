// src/api/tasksApi.ts

import api from "./axiosInstance";
import type { Task, TaskMessage } from "../types/tasks";

export interface TaskListFilters {
  search?: string;        // name=...
  assignee?: "me" | number;
  status?: string;
}

export async function fetchTasks(params?: TaskListFilters): Promise<Task[]> {
  const response = await api.get<Task[]>("/tasks/", {
    params: {
      name: params?.search,
      assignee: params?.assignee,
      status: params?.status,
    },
  });
  return response.data;
}

export async function fetchTask(id: number): Promise<Task> {
  const response = await api.get<Task>(`/tasks/${id}/`);
  return response.data;
}

export interface TaskUpsertPayload {
  title: string;
  description: string;
  priority: string;        // "low" | "medium" | "high"
  status?: string;         // "new", "in_progress", "done", ...
  due_at?: string | null;  // ISO-строка или null
  assignee?: number | null;
  executor_comment?: string;
}

export async function createTask(payload: TaskUpsertPayload): Promise<Task> {
  const response = await api.post<Task>("/tasks/", payload);
  return response.data;
}

export async function updateTask(
  id: number,
  payload: Partial<TaskUpsertPayload>
): Promise<Task> {
  const response = await api.patch<Task>(`/tasks/${id}/`, payload);
  return response.data;
}

export async function uploadTaskAttachment(
  taskId: number,
  file: File
): Promise<void> {
  const formData = new FormData();
  formData.append("file", file);
  await api.post(`/tasks/${taskId}/attachments/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

// --- действия исполнителя ---

// POST /api/tasks/{id}/confirm-on-time/
export async function confirmTaskOnTime(id: number): Promise<Task> {
  const response = await api.post<Task>(`/tasks/${id}/confirm-on-time/`);
  return response.data;
}

// POST /api/tasks/{id}/extend-1d/  body: { comment }
export async function requestTaskExtension(
  id: number,
  comment: string
): Promise<Task> {
  const response = await api.post<Task>(`/tasks/${id}/extend-1d/`, { comment });
  return response.data;
}

// --- чат по задачам (общий по пользователям, мы отфильтруем по задаче) ---

export interface ConversationMessagesParams {
  user_id: number;
}

export async function fetchConversationMessages(
  params: ConversationMessagesParams
): Promise<TaskMessage[]> {
  const response = await api.get<TaskMessage[]>(
    "/tasks/conversation-messages/",
    { params }
  );
  return response.data;
}

export interface SendConversationMessagePayload {
  user_id: number;
  task: number;
  text?: string;
  file?: File;
}

export async function sendConversationMessage(
  payload: SendConversationMessagePayload
): Promise<TaskMessage> {
  const formData = new FormData();
  formData.append("user_id", String(payload.user_id));
  formData.append("task", String(payload.task));
  if (payload.text) formData.append("text", payload.text);
  if (payload.file) formData.append("file", payload.file);

  const response = await api.post<TaskMessage>(
    "/tasks/conversation-messages/",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data;
}
