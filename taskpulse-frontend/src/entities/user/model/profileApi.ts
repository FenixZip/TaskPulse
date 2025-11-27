// src/entities/user/model/profileApi.ts
import { apiClient } from "../../../shared/lib/apiClient";
import type { UserProfile } from "./types";

export const getProfile = async (): Promise<UserProfile> => {
  const { data } = await apiClient.get<UserProfile>("/api/auth/profile/");
  return data;
};

export const updateProfile = async (payload: {
  full_name?: string;
  company?: string;
  position?: string;
  avatar?: File | null;
}): Promise<UserProfile> => {
  const formData = new FormData();

  if (payload.full_name !== undefined) {
    formData.append("full_name", payload.full_name);
  }
  if (payload.company !== undefined) {
    formData.append("company", payload.company);
  }
  if (payload.position !== undefined) {
    formData.append("position", payload.position);
  }
  if (payload.avatar) {
    formData.append("avatar", payload.avatar);
  }

  const { data } = await apiClient.patch<UserProfile>(
    "/api/auth/profile/",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return data;
};

export const changePassword = async (payload: {
  current_password: string;
  new_password: string;
}) => {
  const { data } = await apiClient.post("/api/auth/change-password/", payload);
  return data;
};
