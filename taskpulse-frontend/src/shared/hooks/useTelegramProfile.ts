// src/shared/hooks/useTelegramProfile.ts
import { useQuery } from "@tanstack/react-query";
import { getTelegramProfile } from "../../entities/integrations/model/telegramApi";

export const useTelegramProfile = () => {
  return useQuery({
    queryKey: ["telegramProfile"],
    queryFn: getTelegramProfile,
  });
};
