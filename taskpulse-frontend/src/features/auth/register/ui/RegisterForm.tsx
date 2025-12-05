// src/features/auth/register/ui/RegisterForm.tsx
import { useState } from "react";
import type { FormEvent } from "react";
import { Input } from "../../../../shared/ui/Input";
import { Button } from "../../../../shared/ui/Button";
import { useRegister } from "../model/useRegister";
import { Link, useNavigate } from "react-router-dom";
import { ROUTES } from "../../../../shared/config/routes";

export const RegisterForm = () => {
  const registerMutation = useRegister();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      const payload = {
        email,
        password,
        full_name: fullName,
        company,
        position,
      };

      const result = await registerMutation.mutateAsync(payload);
      console.log("Register success:", result);

      // Показываем явное уведомление и ведём на главную
      alert(
        "Аккаунт создан. Проверьте почту и подтвердите адрес, " +
          "после этого вы сможете войти в систему."
      );
      navigate(ROUTES.landing);
    } catch (error: any) {
      console.log("Register error response:", error?.response?.data);

      const data = error?.response?.data;

      let message = "Не удалось зарегистрироваться. Проверьте данные.";

      if (typeof data === "string") {
        message = data;
      } else if (data) {
        // DRF обычно шлёт объект вида {field: [msg1, msg2], ...}
        if (Array.isArray(data.non_field_errors) && data.non_field_errors.length > 0) {
          message = data.non_field_errors.join(" ");
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
        <h1 className="auth-title">Регистрация создателя</h1>
        <p className="auth-subtitle">
          Создайте аккаунт для управления задачами вашей компании.
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
          label="Компания"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="ООО «Пульс»"
        />
        <Input
          label="Должность"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          placeholder="Руководитель отдела"
        />
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
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Минимум 8 символов"
        />

        {formError && (
          <div className="text-xs text-red-400" style={{ marginTop: "-0.25rem" }}>
            {formError}
          </div>
        )}

        <Button type="submit" fullWidth loading={registerMutation.isPending}>
          Создать аккаунт
        </Button>
      </form>

      <div className="auth-footer-text">
        Уже есть аккаунт?{" "}
        <Link to={ROUTES.login} className="text-[var(--accent)]">
          Войти
        </Link>
      </div>
    </div>
  );
};
