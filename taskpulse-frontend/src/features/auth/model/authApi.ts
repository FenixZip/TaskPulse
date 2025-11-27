// src/features/auth/model/authApi.ts
import { apiClient } from "../../../shared/lib/apiClient";
import type {
  AuthResponse,
  RegisterPayload,
} from "../../../entities/user/model/types";

export interface LoginPayload {
  email: string;
  password: string;
}

export const loginRequest = async (payload: LoginPayload): Promise<AuthResponse> => {
  // у DRF обычно есть слэш в конце
  const { data } = await apiClient.post<AuthResponse>("/api/auth/login/", payload);
  return data;
};

export const registerRequest = async (
  payload: RegisterPayload
): Promise<{ email: string }> => {
  const { data } = await apiClient.post<{ email: string }>("/api/auth/register/", payload);
  return data;
};
