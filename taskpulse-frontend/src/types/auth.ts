// src/types/auth.ts

import type { User } from "./user";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  full_name: string;
  password: string;
  company?: string;
  position?: string;
}
