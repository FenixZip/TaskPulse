// src/entities/integrations/model/telegramApi.ts
import { apiClient } from "../../../shared/lib/apiClient";
import type { TelegramProfile } from "./telegramTypes";

/**
 * Возвращает профиль Telegram.
 * Если пользователя ещё не привязали — Backend отдаёт 404.
 * В этом случае возвращаем null и считаем, что Telegram не подтверждён.
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
