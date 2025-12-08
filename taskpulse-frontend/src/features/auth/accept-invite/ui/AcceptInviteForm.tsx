// src/features/auth/accept-invite/ui/AcceptInviteForm.tsx
import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { Input } from "../../../../shared/ui/Input";
import { Button } from "../../../../shared/ui/Button";
import { useAcceptInvite } from "../model/useAcceptInvite";
import { useAuth } from "../../../../shared/hooks/useAuth";
import { ROUTES } from "../../../../shared/config/routes";

export const AcceptInviteForm = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setAuthState } = useAuth();
  const acceptInviteMutation = useAcceptInvite();

  const [fullName, setFullName] = useState("");
  const [position, setPosition] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const token = params.get("token") ?? "";

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (!token) {
      setFormError("Некорректная ссылка приглашения.");
      return;
    }

    try {
      const payload = {
        token,
        password,
        full_name: fullName,
        position,
      };

      const result = await acceptInviteMutation.mutateAsync(payload);

      // бэкенд всегда делает из инвайта исполнителя
      setAuthState({
        token: result.token,
        user: {
          email: result.email,
          role: "executor",
        },
      });

      // отправляем исполнителя на его дашборд
      navigate(ROUTES.executorDashboard);
    } catch (error: any) {
      const data = error?.response?.data;

      let message = "Не удалось принять приглашение. Попробуйте ещё раз.";

      if (typeof data === "string") {
        message = data;
      } else if (data && typeof data === "object") {
        if (data.detail && typeof data.detail === "string") {
          message = data.detail;
        } else {
          const parts: string[] = [];
          Object.entries(data).forEach(([field, value]) => {
            const v = Array.isArray(value) ? value.join(" ") : String(value);
            parts.push(`${field}: ${v}`);
          });
          if (parts.length > 0) {
            message = parts.join(" ");
          }
        }
      }

      setFormError(message);
    }
  };

  return (
    <div className="auth-card">
      <div>
        <h1 className="auth-title">Приглашение в Pulse-zone</h1>
        <p className="auth-subtitle">
          Заполните данные и придумайте пароль, чтобы присоединиться как
          исполнитель.
        </p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <Input
          label="Имя и фамилия"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Иван Иванов"
        />

        <Input
          label="Должность"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          placeholder="Исполнитель задач"
        />

        <Input
          label="Пароль"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Минимум 8 символов"
        />

        {formError && (
          <div
            className="text-xs text-red-400"
            style={{ marginTop: "-0.25rem" }}
          >
            {formError}
          </div>
        )}

        <Button
          type="submit"
          fullWidth
          loading={acceptInviteMutation.isPending}
        >
          Принять приглашение
        </Button>
      </form>
    </div>
  );
};
