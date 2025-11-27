// src/entities/user/model/types.ts

export type UserRole = "creator" | "executor";

export interface AuthResponse {
  token: string;
  email: string;
  role: UserRole;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  company: string;
  position: string;
}

export interface AuthUser {
  email: string;
  role: UserRole;
}

export interface AuthState {
  token: string | null;
  user: AuthUser | null;
}

export interface UserProfile {
  id: number;
  role: UserRole;
  avatar: string | null;
  full_name: string;
  company: string;
  position: string;
  email: string;
  invited_by: string | null;
}
