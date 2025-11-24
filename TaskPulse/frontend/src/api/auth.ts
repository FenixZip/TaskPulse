const TOKEN_KEY = "taskpulseToken";
const EMAIL_KEY = "taskpulseEmail";
const ROLE_KEY = "taskpulseRole";

export interface AuthUser {
  email: string;
  role: string;
}

export function saveAuth(token: string, email: string, role: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EMAIL_KEY, email);
  localStorage.setItem(ROLE_KEY, role);
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMAIL_KEY);
  localStorage.removeItem(ROLE_KEY);
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem(TOKEN_KEY);
}

export function getCurrentUser(): AuthUser | null {
  const email = localStorage.getItem(EMAIL_KEY);
  const role = localStorage.getItem(ROLE_KEY);
  if (!email || !role) return null;
  return { email, role };
}
