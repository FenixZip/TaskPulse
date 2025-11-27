// src/features/auth/login/ui/LoginForm.tsx
import { useState } from "react";
import type { FormEvent } from "react";
import { Input } from "../../../../shared/ui/Input";
import { Button } from "../../../../shared/ui/Button";
import { useLogin } from "../model/useLogin";
import { Link, useNavigate } from "react-router-dom";
import { ROUTES } from "../../../../shared/config/routes";
import { useAuth } from "../../../../shared/hooks/useAuth";

export const LoginForm = () => {
  const loginMutation = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const navigate = useNavigate();
    const { setAuthState } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      const result = await loginMutation.mutateAsync({ email, password });

      // сохраняем токен и пользователя в контекст
      setAuthState({
        token: result.token,
        user: {
          email: result.email,
          role: result.role,
        },
      });

      // редирект по роли
      if (result.role === "creator") {
        navigate(ROUTES.creatorDashboard);
      } else {
        navigate(ROUTES.executorDashboard);
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.non_field_errors?.[0] ||
        "Не удалось войти. Проверьте данные.";
      setFormError(message);
    }
  };

  return (
    <div className="auth-card">
      <div>
        <h1 className="auth-title">Вход в Pulse-zone</h1>
        <p className="auth-subtitle">Продолжите работу с задачами вашей команды.</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <Input
          label="E-mail"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
        />
        <Input
          label="Пароль"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Введите пароль"
        />

        {formError && (
          <div className="text-xs text-red-400" style={{ marginTop: "-0.25rem" }}>
            {formError}
          </div>
        )}

        <Button type="submit" fullWidth loading={loginMutation.isPending}>
          Войти
        </Button>
      </form>

      <div className="auth-footer-text">
        Нет аккаунта?{" "}
        <Link to={ROUTES.register} className="text-[var(--accent)]">
          Зарегистрироваться
        </Link>
      </div>
    </div>
  );
};
