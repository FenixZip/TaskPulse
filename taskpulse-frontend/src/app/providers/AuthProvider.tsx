// src/app/providers/AuthProvider.tsx
import { createContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { AuthState } from "../../entities/user/model/types";
import { AUTH_STORAGE_KEY } from "../../shared/lib/apiClient";

interface AuthContextValue {
  auth: AuthState;
  setAuthState: (value: AuthState) => void;
  logout: () => void;
}

const defaultState: AuthState = {
  token: null,
  user: null,
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [auth, setAuth] = useState<AuthState>(() => {
    if (typeof window === "undefined") return defaultState;
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return defaultState;
      const parsed = JSON.parse(raw) as AuthState;
      return parsed;
    } catch {
      return defaultState;
    }
  });

  useEffect(() => {
    if (auth.token) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [auth]);

  const setAuthState = (value: AuthState) => {
    setAuth(value);
  };

  const logout = () => {
    setAuth(defaultState);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ auth, setAuthState, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
