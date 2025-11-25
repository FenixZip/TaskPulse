import React, { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { passwordResetConfirm } from "../../api/authApi";

export const PasswordResetConfirmPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = searchParams.get("token");
    setResetToken(token);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken) {
      setError("Токен сброса не найден.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await passwordResetConfirm({
        reset_token: resetToken,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm,
      });
      setMessage(res.detail ?? "Пароль успешно изменён. Теперь вы можете войти.");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ??
          err?.response?.data?.reset_token ??
          err?.response?.data?.new_password_confirm ??
          "Ошибка при сбросе пароля."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <div style={{ maxWidth: 500, margin: "40px auto" }}>
        <h1>Сброс пароля</h1>
        <div style={{ color: "red" }}>Некорректная ссылка для сброса пароля.</div>
        <Link to="/login">На страницу входа</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 500, margin: "40px auto" }}>
      <h1>Новый пароль</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Новый пароль</label>
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div>
          <label>Повторите пароль</label>
          <input
            type="password"
            required
            value={newPasswordConfirm}
            onChange={(e) => setNewPasswordConfirm(e.target.value)}
          />
        </div>
        {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
        {message && <div style={{ color: "green", marginTop: 8 }}>{message}</div>}
        <button type="submit" disabled={loading} style={{ marginTop: 8 }}>
          {loading ? "Сохраняем..." : "Сохранить пароль"}
        </button>
      </form>
      <div style={{ marginTop: 12 }}>
        <Link to="/login">На страницу входа</Link>
      </div>
    </div>
  );
};
