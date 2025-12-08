// src/entities/integrations/model/telegramApi.ts
import { apiClient } from "../../../shared/lib/apiClient";
import type { TelegramProfile } from "./telegramTypes";

/**
 * Профиль Telegram текущего пользователя.
 */
export const getTelegramProfile = async (): Promise<TelegramProfile | null> => {
  try {
    const { data } = await apiClient.get<TelegramProfile>(
      "/api/integrations/telegram/profile/",
    );
    return data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

/**
 * Запрашивает у backend deep-link для привязки Telegram.
 */
export const getTelegramConnectLink = async (): Promise<string> => {
  const { data } = await apiClient.post<{ link: string }>(
    "/api/integrations/telegram/link-start/",
  );
  return data.link;
};
