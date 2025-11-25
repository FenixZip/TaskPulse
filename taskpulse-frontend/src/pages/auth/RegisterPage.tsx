import React, { useState } from "react";
import { register } from "../../api/authApi";
import { Link } from "react-router-dom";

export const RegisterPage: React.FC = () => {
  const [form, setForm] = useState({
    email: "",
    full_name: "",
    company: "",
    position: "",
    password: "",
    password_confirm: "", // только для проверки на фронте
  });

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    // 1) простая проверка совпадения паролей на фронте
    if (form.password !== form.password_confirm) {
      setError("Пароли не совпадают");
      return;
    }

    // 2) можно сразу предупредить про длину
    if (form.password.length < 8) {
      setError("Пароль должен быть не короче 8 символов");
      return;
    }

    setLoading(true);
    try {
      const res = await register({
        email: form.email,
        full_name: form.full_name,
        password: form.password,
        company: form.company || undefined,
        position: form.position || undefined,
      });

      setMessage(
        res.detail ||
          "Пользователь создан. Проверьте почту и подтвердите email."
      );
    } catch (err: any) {
      // Попробуем вытащить понятную ошибку из ответа DRF
      const data = err?.response?.data;
      if (typeof data === "string") {
        setError(data);
      } else if (data?.detail) {
        setError(data.detail);
      } else if (data) {
        // берём первое поле с ошибкой
        const firstKey = Object.keys(data)[0];
        const firstVal = data[firstKey];
        if (Array.isArray(firstVal)) {
          setError(firstVal[0]);
        } else {
          setError(String(firstVal));
        }
      } else {
        setError("Ошибка регистрации");
      }
      console.error("Register error", err?.response?.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: "40px auto" }}>
      <h1>Регистрация</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>ФИО</label>
          <input
            name="full_name"
            required
            value={form.full_name}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Компания</label>
          <input
            name="company"
            value={form.company}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Должность</label>
          <input
            name="position"
            value={form.position}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Пароль</label>
          <input
            name="password"
            type="password"
            required
            value={form.password}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Повторите пароль</label>
          <input
            name="password_confirm"
            type="password"
            required
            value={form.password_confirm}
            onChange={handleChange}
          />
        </div>

        {error && (
          <div style={{ color: "red", marginTop: 8 }}>{error}</div>
        )}
        {message && (
          <div style={{ color: "green", marginTop: 8 }}>{message}</div>
        )}

        <button type="submit" disabled={loading} style={{ marginTop: 8 }}>
          {loading ? "Регистрируем..." : "Зарегистрироваться"}
        </button>
      </form>

      <div style={{ marginTop: 12 }}>
        Уже есть аккаунт? <Link to="/login">Войти</Link>
      </div>
    </div>
  );
};
