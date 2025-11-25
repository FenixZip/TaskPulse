// src/types/user.ts

export type UserRole = "CREATOR" | "EXECUTOR";

export interface User {
  id: number;
  email: string;
  full_name: string;
  company: string | null;
  position: string | null;
  role: UserRole;
  email_verified: boolean;
}
