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

export function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password1 !== password2) {
      setError("Пароли не совпадают");
      return;
    }

    setLoading(true);

    try {
      // эндпоинт регистрации: POST /api/auth/register/
      const response = await apiClient.post("/auth/register/", {
        email,
        password: password1,
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
        "Ошибка регистрации. Попробуйте ещё раз.";
      setError(
        typeof detail === "string"
          ? detail
          : "Ошибка регистрации. Попробуйте ещё раз."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
      <Paper sx={{ p: 4, minWidth: 360 }}>
        <Typography variant="h5" sx={{ mb: 2, textAlign: "center" }}>
          Регистрация в TaskPulse
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
              value={password1}
              onChange={(e) => setPassword1(e.target.value)}
              fullWidth
              required
            />

            <TextField
              label="Повторите пароль"
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              fullWidth
              required
            />

            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              fullWidth
            >
              {loading ? "Регистрируем..." : "Зарегистрироваться"}
            </Button>

            <Typography align="center" variant="body2">
              Уже есть аккаунт?{" "}
              <RouterLink to="/login">Войти</RouterLink>
            </Typography>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
