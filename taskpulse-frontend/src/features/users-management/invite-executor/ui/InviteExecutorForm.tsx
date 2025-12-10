// src/features/users-management/invite-executor/ui/InviteExecutorForm.tsx
import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../../shared/lib/apiClient";
import { Input } from "../../../../shared/ui/Input";
import { Button } from "../../../../shared/ui/Button";

const inviteExecutorRequest = async (email: string) => {
  const { data } = await apiClient.post("/api/auth/invitations/", { email });
  return data;
};

export const InviteExecutorForm = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: inviteExecutorRequest,
    onSuccess: () => {
      // обновляем список исполнителей
      queryClient.invalidateQueries({ queryKey: ["executors"] });
      setMessage("Приглашение отправлено.");
      setError(null);
      setEmail("");
    },
    onError: (err: any) => {
      const detail =
        err?.response?.data?.detail ??
        err?.response?.data?.error ??
        "Не удалось отправить приглашение.";
      setError(detail);
      setMessage(null);
    },
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setError("Введите e-mail исполнителя.");
      return;
    }

    mutation.mutate(trimmed);
  };

  return (
    <form
      onSubmit={handleSubmit}
      // аккуратное центрирование без tailwind
      style={{
        margin: "1.5rem auto 0",
        maxWidth: 640,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "flex-end",
        justifyContent: "center",
        columnGap: "12px",
        rowGap: "8px",
      }}
    >
      <div style={{ flex: 1, minWidth: 260 }}>
        <Input
          label="Пригласить исполнителя по e-mail"
          type="email"
          placeholder="team.member@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          error={error ?? undefined}
        />
      </div>

      <div>
        <Button type="submit" loading={mutation.isPending}>
          Отправить приглашение
        </Button>
      </div>

      {message && (
        <div
          style={{
            flexBasis: "100%",
            fontSize: "0.8rem",
            color: "var(--text-secondary)",
            marginTop: 4,
            textAlign: "center",
          }}
        >
          {message}
        </div>
      )}
    </form>
  );
};
