// src/features/tasks/create-task/ui/CreateTaskModal.tsx
import { useState, type FormEvent, useEffect } from "react";
import {
  useCreateTask,
  type CreateTaskPayload,
} from "../model/useCreateTask";
import { Input } from "../../../../shared/ui/Input";
import { Button } from "../../../../shared/ui/Button";
import { useExecutors } from "../../../users-management/executors-list/model/useExecutors";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;

  assigneeId: number | null;
  assigneeName?: string | null;
}

export const CreateTaskModal = ({
  isOpen,
  onClose,
  assigneeId,
  assigneeName,
}: CreateTaskModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] =
    useState<"low" | "medium" | "high">("medium");
  const [dueAt, setDueAt] = useState<string>("");

  const [internalAssigneeId, setInternalAssigneeId] = useState<
    number | null
  >(assigneeId);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: executors } = useExecutors();
  const createTask = useCreateTask();

  useEffect(() => {
    setInternalAssigneeId(assigneeId);
  }, [assigneeId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (!internalAssigneeId) {
      setFormError("Выберите исполнителя.");
      return;
    }

    const payload: CreateTaskPayload = {
      title,
      description,
      priority,
      assignee: internalAssigneeId,
      due_at: dueAt ? new Date(dueAt).toISOString() : null,
    };

    try {
      await createTask.mutateAsync(payload);
      setTitle("");
      setDescription("");
      setPriority("medium");
      setDueAt("");
      onClose();
    } catch (_error) {
      setFormError("Не удалось создать задачу. Попробуйте ещё раз.");
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-lg rounded-2xl bg-[var(--bg-elevated)] p-6 shadow-xl">
        <h2 className="text-xl font-semibold mb-3">Создать задачу</h2>

        {assigneeName && (
          <p className="text-sm text-[var(--text-secondary)] mb-3">
            Исполнитель: <strong>{assigneeName}</strong>
          </p>
        )}

        {!assigneeName && (
          <div className="mb-3">
            <label className="flex flex-col gap-1 text-sm">
              <span>Исполнитель</span>
              <select
                className="rounded-lg border bg-[#020617] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors border-[var(--border-subtle)] focus:border-[var(--accent)]"
                value={internalAssigneeId ?? ""}
                onChange={(e) =>
                  setInternalAssigneeId(
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
              >
                <option value="">Выберите исполнителя…</option>
                {executors?.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.full_name || ex.email}
                    {ex.company ? ` (${ex.company})` : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Название задачи"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <label className="flex flex-col gap-1 text-sm">
            <span>Описание задачи</span>
            <textarea
              className="rounded-lg border bg-[#020617] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors border-[var(--border-subtle)] focus:border-[var(--accent)] placeholder:text-[var(--text-secondary)] min-h-[80px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Кратко опишите, что нужно сделать…"
            />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span>Приоритет</span>
              <select
                className="rounded-lg border bg-[#020617] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors border-[var(--border-subtle)] focus:border-[var(--accent)]"
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as "low" | "medium" | "high")
                }
              >
                <option value="low">Низкий</option>
                <option value="medium">Средний</option>
                <option value="high">Высокий</option>
              </select>
            </label>

            <div className="flex flex-col gap-1 text-sm">
              <span>Дедлайн</span>
              <input
                type="datetime-local"
                className="w-full rounded-xl bg-black/20 border border-[var(--border-subtle)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)] text-[var(--text-primary)]"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
              />
            </div>
          </div>

          {formError && (
            <div className="text-xs text-red-400">{formError}</div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" loading={createTask.isPending}>
              Создать задачу
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
