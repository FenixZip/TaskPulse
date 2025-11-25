import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { verifyEmail } from "../../api/authApi";

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setError("Токен подтверждения не найден.");
      setLoading(false);
      return;
    }

    const doVerify = async () => {
      try {
        const res = await verifyEmail(token);
        setMessage(res.detail ?? "Почта успешно подтверждена!");
      } catch (err: any) {
        setError(err?.response?.data?.detail ?? "Ошибка подтверждения почты.");
      } finally {
        setLoading(false);
      }
    };

    void doVerify();
  }, [searchParams]);

  if (loading) return <div style={{ margin: 40 }}>Подтверждаем почту...</div>;

  return (
    <div style={{ maxWidth: 500, margin: "40px auto" }}>
      <h1>Подтверждение почты</h1>
      {message && <div style={{ color: "green", marginBottom: 12 }}>{message}</div>}
      {error && <div style={{ color: "red", marginBottom: 12 }}>{error}</div>}
      <Link to="/login">Перейти к входу</Link>
    </div>
  );
};
