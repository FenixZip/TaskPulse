// src/entities/user/model/useProfile.ts
import { useQuery } from "@tanstack/react-query";
import { getProfile } from "./profileApi";
import { useAuth } from "../../../shared/hooks/useAuth";

export const useProfile = () => {
  const { auth } = useAuth();
  return useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    enabled: !!auth.token,
  });
};
