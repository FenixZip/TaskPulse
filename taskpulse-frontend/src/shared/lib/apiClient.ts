// src/shared/lib/apiClient.ts
import axios from "axios";
import { API_BASE_URL } from "../config/env";

export const AUTH_STORAGE_KEY = "pulse_zone_auth";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
});

// автоматически подставляем токен, если он есть в localStorage
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { token?: string };
        if (parsed.token) {
          config.headers = config.headers ?? {};
          config.headers.Authorization = `Token ${parsed.token}`;
        }
      } catch {
        // игнорируем ошибки парсинга
      }
    }
  }
  return config;
});
