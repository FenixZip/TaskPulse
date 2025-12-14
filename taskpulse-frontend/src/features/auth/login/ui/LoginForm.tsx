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

  // состояние блока повторной отправки письма
  const [showResendForm, setShowResendForm] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setResendMessage(null);

    try {
      const result = await loginMutation.mutateAsync({ email, password });

      // сохраняем токен и пользователя
      setAuthState({
        token: result.token,
        user: {
          email: result.email,
          role: result.role,
        },
      });

      // После логина всегда идём в /app.
      // Дальше RequireTelegram решит:
      // - если Telegram подтверждён -> пустит в приложение
      // - если нет -> отправит на /app/connect-telegram
      navigate(ROUTES.appRoot, { replace: true });
    } catch (error: any) {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.non_field_errors?.[0] ||
        "Не удалось войти. Проверьте данные.";

      setFormError(message);
    }
  };

  const handleResend = async () => {
    if (!resendEmail) return;
    setResendMessage(null);

    try {
      const res = await resendMutation.mutateAsync({ email: resendEmail });
      setResendMessage(
        res.detail ||
          "Письмо отправлено, проверьте почту (включая папку «Спам»).",
      );

      // прячем форму после успешной отправки
      setShowResendForm(false);
      setResendEmail("");
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
      <p className="auth-subtitle">Продолжите работу с задачами вашей команды.</p>

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

        {/* Забыли пароль */}
        <div className="text-xs">
          <Link
            to={ROUTES.resetPasswordRequest}
            className="text-[var(--accent)] underline"
          >
            Забыли пароль?
          </Link>
        </div>

        {/* Блок повторной отправки письма подтверждения */}
        <div className="text-xs text-slate-300 space-y-1">
          {!showResendForm && (
            <>
              <button
                type="button"
                onClick={() => {
                  setShowResendForm(true);
                  setResendMessage(null);
                }}
                className="text-[var(--accent)] underline"
              >
                Не пришло письмо подтверждения?
              </button>

              {resendMessage && (
                <div className="mt-1 text-[var(--text-secondary)]">
                  {resendMessage}
                </div>
              )}
            </>
          )}

          {showResendForm && (
            <div className="mt-2 space-y-2 rounded-2xl border border-[var(--border-subtle)] bg-black/30 p-3">
              <Input
                label="E-mail для повторной отправки"
                type="email"
                placeholder="you@example.com"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                required
              />

              <div className="flex items-center justify-between gap-2">
                <Button
                  type="button"
                  onClick={handleResend}
                  loading={resendMutation.isPending}
                >
                  Отправить письмо ещё раз
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setShowResendForm(false);
                    setResendEmail("");
                  }}
                  className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--accent)]"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}
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
