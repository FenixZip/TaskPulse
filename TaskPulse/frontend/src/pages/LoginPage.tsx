// @ts-nocheck
import React, { useState } from "react";
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  Alert,
  Stack,
} from "@mui/material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { apiClient } from "../api/client";
import { saveAuth } from "../api/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // эндпоинт логина на бэке: POST /api/auth/login/
      const response = await apiClient.post("/auth/login/", {
        email,
        password,
      });

      const { token, email: userEmail, role } = response.data;
      saveAuth(token, userEmail, role);

      navigate("/app", { replace: true });
    } catch (err: any) {
      console.error(err);
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.non_field_errors ||
        err?.response?.data?.email ||
        "Ошибка входа. Проверьте email и пароль.";
      setError(
        typeof detail === "string" ? detail : "Ошибка входа. Попробуйте ещё раз."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
      <Paper sx={{ p: 4, minWidth: 360 }}>
        <Typography variant="h5" sx={{ mb: 2, textAlign: "center" }}>
          Вход в TaskPulse
        </Typography>

        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
            />

            <TextField
              label="Пароль"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
            />

            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              fullWidth
            >
              {loading ? "Входим..." : "Войти"}
            </Button>

            <Typography align="center" variant="body2">
              Нет аккаунта?{" "}
              <RouterLink to="/register">Зарегистрироваться</RouterLink>
            </Typography>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
