// src/api/integrationsApi.ts

import api from "./axiosInstance";

export interface TelegramProfile {
  id: number;
  telegram_user_id: number;
  chat_id: number;
  created_at: string;
  last_activity_at: string;
}

/**
 * Получить телеграм-профиль текущего пользователя.
 * Если телеграм не привязан, бек вернёт 404 — мы преобразуем это в null.
 */
export async function fetchTelegramProfile(): Promise<TelegramProfile | null> {
  try {
    const response = await api.get<TelegramProfile>(
      "/integrations/telegram/profile/"
    );
    return response.data;
  } catch (err: any) {
    if (err?.response?.status === 404) {
      return null;
    }
    throw err;
  }
}
