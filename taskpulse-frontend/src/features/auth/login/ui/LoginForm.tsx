// src/features/auth/login/ui/LoginForm.tsx
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Input } from "../../../../shared/ui/Input";
import { Button } from "../../../../shared/ui/Button";
import { useLogin } from "../model/useLogin";
import { useAuth } from "../../../../shared/hooks/useAuth";
import { useResendVerification } from "../../verify-email/model/useResendVerification";
import { ROUTES } from "../../../../shared/config/routes";

export const LoginForm = () => {
  const loginMutation = useLogin();
  const resendMutation = useResendVerification();
  const { setAuthState } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setResendMessage(null);

    try {
      const result = await loginMutation.mutateAsync({ email, password });

      // сохраняем токен и роль в контекст
      setAuthState({
        token: result.token,
        user: {
          email: result.email,
          role: result.role,
        },
      });

      // ✅ сразу уходим на нужную страницу задач
      if (result.role === "creator") {
        navigate(ROUTES.creatorDashboard);   // /app/creator/tasks
      } else {
        navigate(ROUTES.executorDashboard);  // /app/executor/tasks
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.non_field_errors?.[0] ||
        "Не удалось войти. Проверьте данные.";

      setFormError(message);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResendMessage(null);

    try {
      const res = await resendMutation.mutateAsync({ email });
      setResendMessage(
        res.detail || "Письмо отправлено, проверьте почту (включая «Спам»)."
      );
    } catch (error: any) {
      const msg =
        error?.response?.data?.detail ||
        "Не удалось отправить письмо. Попробуйте позже.";
      setResendMessage(msg);
    }
  };

  return (
    <div className="auth-card">
      <h1 className="auth-title">Вход в Pulse-zone</h1>
      <p className="auth-subtitle">
        Продолжите работу с задачами вашей команды.
      </p>

      {formError && <div className="auth-error mt-3">{formError}</div>}

      <form onSubmit={handleSubmit} className="auth-form mt-4 space-y-4">
        <Input
          label="E-mail"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label="Пароль"
          type="password"
          placeholder="Введите пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="text-xs text-slate-300 space-y-1">
          <div>Не пришло письмо подтверждения?</div>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendMutation.isPending || !email}
            className="text-[var(--accent)] underline disabled:opacity-50"
          >
            {resendMutation.isPending
              ? "Отправляем письмо..."
              : "Отправить письмо ещё раз"}
          </button>

          {resendMessage && (
            <div className="mt-1 text-[var(--muted-text)]">
              {resendMessage}
            </div>
          )}
        </div>

        <div className="text-xs">
          <Link
            to={ROUTES.resetPasswordRequest}
            className="text-[var(--accent)] underline"
          >
            Забыли пароль?
          </Link>
        </div>

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
