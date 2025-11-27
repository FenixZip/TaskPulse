// src/entities/integrations/model/telegramTypes.ts

export interface TelegramProfile {
  id: number;
  telegram_user_id: number;
  chat_id: number;
  created_at: string;
  last_activity_at: string | null;
}
