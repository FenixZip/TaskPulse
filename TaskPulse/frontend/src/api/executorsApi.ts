// @ts-nocheck
import { apiClient } from "./client";

export interface Executor {
  id: number;
  email: string;
  full_name: string;
  company?: string;
  position?: string;
}

/** Список исполнителей Создателя */
export async function fetchExecutors() {
  const response = await apiClient.get<Executor[]>("/auth/executors/");
  return response.data;
}

/** Приглашение исполнителя по email */
export async function inviteExecutor(email: string) {
  const response = await apiClient.post("/auth/invitations/", { email });
  return response.data;
}
