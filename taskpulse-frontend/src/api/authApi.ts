// src/api/authApi.ts

import api from "./axiosInstance";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
} from "../types/auth";
import type { User } from "../types/user";

// ЛОГИН
export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>("/auth/login/", data);
  return response.data;
}

// РЕГИСТРАЦИЯ СОЗДАТЕЛЯ
export async function register(
  data: RegisterRequest
): Promise<{ detail: string; email?: string }> {
  const response = await api.post("/auth/register/", data);
  return response.data;
}

// ----- НОВОЕ: создание инвайта исполнителю -----

export interface CreateInvitationResponse {
  detail?: string;
}

export async function createInvitation(
  email: string
): Promise<CreateInvitationResponse> {
  const response = await api.post<CreateInvitationResponse>(
    "/auth/invitations/",
    { email }
  );
  return response.data;
}

// -----------------------------------------------

// ПОДТВЕРЖДЕНИЕ EMAIL
export async function verifyEmail(token: string): Promise<{ detail: string }> {
  const response = await api.post("/auth/verify-email/", { token });
  return response.data;
}

// ПОВТОРНАЯ ОТПРАВКА ПИСЬМА
export async function resendVerification(
  email: string
): Promise<{ detail: string }> {
  const response = await api.post("/auth/resend-verification/", { email });
  return response.data;
}

// ПОДТВЕРЖДЕНИЕ СБРОСА ПАРОЛЯ
export interface PasswordResetConfirmRequest {
  reset_token: string;
  new_password: string;
  new_password_confirm: string;
}

export async function passwordResetConfirm(
  data: PasswordResetConfirmRequest
): Promise<{ detail: string }> {
  const response = await api.post("/auth/password-reset-confirm/", data);
  return response.data;
}

// ПРОФИЛЬ
export async function fetchProfile(): Promise<User> {
  const response = await api.get<User>("/auth/profile/");
  return response.data;
}

// СМЕНА ПАРОЛЯ
export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

export async function changePassword(
  data: ChangePasswordRequest
): Promise<{ detail: string }> {
  const response = await api.post("/auth/change-password/", data);
  return response.data;
}

// ОБНОВЛЕНИЕ ПРОФИЛЯ
export interface UpdateProfilePayload {
  full_name?: string;
  company?: string;
  position?: string;
}

export async function updateProfile(
  data: UpdateProfilePayload
): Promise<User> {
  const response = await api.patch<User>("/auth/profile/", data);
  return response.data;
}

// ИСПОЛНИТЕЛИ (короткий список)
export interface ExecutorShort {
  id: number;
  full_name: string;
  email: string;
}

export async function fetchExecutors(): Promise<ExecutorShort[]> {
  const response = await api.get<ExecutorShort[]>("/auth/executors/");
  return response.data;
}
