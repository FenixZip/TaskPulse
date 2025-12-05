// src/features/users-management/invite-executor/ui/InviteExecutorForm.tsx
import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../../shared/lib/apiClient";
import { Input } from "../../../../shared/ui/Input";
import { Button } from "../../../../shared/ui/Button";

const inviteExecutorRequest = async (email: string) => {
  const { data } = await apiClient.post("/api/auth/invitations", { email });
  return data;
};

export const InviteExecutorForm = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (value: string) => inviteExecutorRequest(value),
    onSuccess: () => {
      // на всякий случай можно обновить список исполнителей
      queryClient.invalidateQueries({ queryKey: ["executors"] });
    },
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    try {
      await mutation.mutateAsync(email);
      setMessage(
        "Приглашение отправлено. Исполнитель получит письмо с инструкциями."
      );
      setEmail("");
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.email?.[0] ||
        "Не удалось отправить приглашение.";
      setError(detail);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 md:flex-row md:items-end max-w-xl"
    >
      <div className="flex-1">
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

      <Button type="submit" loading={mutation.isPending}>
        Отправить приглашение
      </Button>

      {message && (
        <div className="text-xs text-[var(--text-secondary)] md:mt-0 mt-1">
          {message}
        </div>
      )}
    </form>
  );
};
