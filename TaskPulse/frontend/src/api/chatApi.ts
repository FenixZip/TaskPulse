// @ts-nocheck
import { apiClient } from "./client";

export interface TaskMessage {
  id: number;
  task: number;
  task_title: string;
  sender: number;
  sender_name: string;
  text: string;
  file_url: string | null;
  is_from_creator: boolean;
  is_from_executor: boolean;
  created_at: string;
}

export interface SendMessagePayload {
  userId: number;
  taskId: number;
  text?: string;
  file?: File | null;
}

/** Получить общий диалог по всем задачам с конкретным пользователем */
export async function fetchConversationMessages(userId: number) {
  const response = await apiClient.get<TaskMessage[]>(
    "/tasks/conversation-messages/",
    { params: { user_id: userId } }
  );
  return response.data;
}

/** Отправить сообщение в общий диалог (с привязкой к задаче) */
export async function sendConversationMessage(
  payload: SendMessagePayload
): Promise<TaskMessage> {
  const formData = new FormData();
  formData.append("user_id", String(payload.userId));
  formData.append("task", String(payload.taskId));
  if (payload.text) formData.append("text", payload.text);
  if (payload.file) formData.append("file", payload.file);

  const response = await apiClient.post<TaskMessage>(
    "/tasks/conversation-messages/",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return response.data;
}
