// src/pages/auth/ResetPasswordRequestPage.tsx
import { useState } from "react";
import type { FormEvent } from "react";

import { Input } from "../../shared/ui/Input";
import { Button } from "../../shared/ui/Button";
import { usePasswordResetRequest } from "../../features/auth/reset-password/model/usePasswordResetRequest";
import { Link } from "react-router-dom";
import { ROUTES } from "../../shared/config/routes";

export const ResetPasswordRequestPage = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const mutation = usePasswordResetRequest();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);

    const defaultMsg =
      "Если пользователь с таким E-mail существует, мы отправили письмо для смены пароля.";

    try {
      const res = await mutation.mutateAsync({ email });
      // даже если на бэке свой текст – покажем его, иначе дефолтный
      setMessage(res?.detail || defaultMsg);
    } catch {
      // даже если запрос технически «упал», письмо обычно уже отправлено,
      // поэтому всё равно показываем успешный текст
      setMessage(defaultMsg);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div>
          <h1 className="auth-title">Восстановление пароля</h1>
          <p className="auth-subtitle">
            Укажите E-mail, мы отправим ссылку для смены пароля.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <Input
            label="E-mail"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />

          {message && (
            <div className="mt-2 text-xs text-[var(--accent)]">{message}</div>
          )}

          <Button type="submit" fullWidth loading={mutation.isPending}>
            Отправить письмо
          </Button>
        </form>

        <div className="auth-footer-text">
          Вспомнили пароль?{" "}
          <Link to={ROUTES.login} className="text-[var(--accent)]">
            Войти
          </Link>
        </div>
      </div>
    </div>
  );
};
