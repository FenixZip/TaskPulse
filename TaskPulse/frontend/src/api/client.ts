import axios from "axios";

export const apiClient = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// добавляем токен перед каждым запросом
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("taskpulseToken");
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Token ${token}`;
  }
  return config;
});
