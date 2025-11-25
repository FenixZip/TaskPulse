// src/pages/profile/ChangePasswordPage.tsx
import React, { useState } from "react";
import { changePassword } from "../../api/authApi";

export const ChangePasswordPage: React.FC = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      });
      setMessage(res.detail ?? "Пароль изменён");
      setOldPassword("");
      setNewPassword("");
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ??
          err?.response?.data?.old_password ??
          err?.response?.data?.new_password ??
          "Ошибка при смене пароля"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 500 }}>
      <h1>Смена пароля</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Текущий пароль</label>
          <input
            type="password"
            required
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
        </div>
        <div>
          <label>Новый пароль</label>
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
        {message && <div style={{ color: "green", marginTop: 8 }}>{message}</div>}
        <button type="submit" disabled={loading} style={{ marginTop: 8 }}>
          {loading ? "Сохраняем..." : "Сменить пароль"}
        </button>
      </form>
    </div>
  );
};
