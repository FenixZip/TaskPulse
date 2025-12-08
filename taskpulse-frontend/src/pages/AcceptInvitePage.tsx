import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { apiClient } from "@/shared/lib/apiClient";

export const AcceptInvitePage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get("token");

    if (!token) return;

    apiClient
      .post("/api/auth/invitations/accept/", { token })
      .then(() => {
        alert("Приглашение принято, вы можете войти");
        navigate("/login");
      })
      .catch(() => {
        alert("Ошибка: ссылка недействительна или устарела");
      });
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <h1>Обрабатываем приглашение…</h1>
    </div>
  );
};
