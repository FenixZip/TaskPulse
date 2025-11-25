// src/context/AuthContext.tsx

import React, { createContext, useEffect, useState } from "react";
import type { User } from "../types/user";
import type { LoginRequest } from "../types/auth";
import {
  login as apiLogin,
  fetchProfile,
} from "../api/authApi";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  reloadProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  logout: () => {},
  reloadProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem("authToken")
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const profile = await fetchProfile();
        setUser(profile);
      } catch {
        setToken(null);
        localStorage.removeItem("authToken");
      } finally {
        setLoading(false);
      }
    };

    void init(); // убираем warning про промис
  }, [token]);

  const login = async (data: LoginRequest) => {
    const res = await apiLogin(data);
    localStorage.setItem("authToken", res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    setToken(null);
    setUser(null);
  };

  const reloadProfile = async () => {
    if (!token) return;
    const profile = await fetchProfile();
    setUser(profile);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout, reloadProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};
