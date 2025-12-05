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

export interface ResendVerificationPayload {
  email: string;
}

export interface ResendVerificationResponse {
  detail: string;
}

export const resendVerificationRequest = async (
  payload: ResendVerificationPayload
): Promise<ResendVerificationResponse> => {
  const { data } = await apiClient.post<ResendVerificationResponse>(
    "/api/auth/resend-verification/",
    payload
  );
  return data;
};

export interface PasswordResetRequestPayload {
  email: string;
}

export interface PasswordResetRequestResponse {
  detail: string;
}

export const passwordResetRequest = async (
  payload: PasswordResetRequestPayload
): Promise<PasswordResetRequestResponse> => {
  const { data } = await apiClient.post<PasswordResetRequestResponse>(
    "/api/auth/password-reset/",
    payload
  );
  return data;
};
