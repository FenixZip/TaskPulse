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

  // если модалку открыли "из исполнителя" — можно сразу передать id/имя
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
  const [dueAt, setDueAt] = useState<string>("");

  const [internalAssigneeId, setInternalAssigneeId] =
    useState<number | null>(assigneeId);

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

    if (!title.trim()) {
      setFormError("Введите название задачи.");
      return;
    }

    const payload: CreateTaskPayload = {
      title: title.trim(),
      description: description.trim(),
      assignee: internalAssigneeId,
      // приоритет больше не выбираем — всегда Средний
      priority: "medium",
      due_at: dueAt ? new Date(dueAt).toISOString() : null,
    };

    try {
      await createTask.mutateAsync(payload);
      setTitle("");
      setDescription("");
      setDueAt("");
      onClose();
    } catch {
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
                className="rounded-lg border border-[var(--border-subtle)] bg-[#020617] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                value={internalAssigneeId ?? ""}
                onChange={(e) =>
                  setInternalAssigneeId(
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
              >
                <option value="">Не выбран</option>
                {(executors ?? []).map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.full_name || ex.email}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        <form className="space-y-3" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1 text-sm">
            <span>Название задачи</span>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Позвонить клиенту…"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span>Описание задачи</span>
            <textarea
              className="min-h-[80px] rounded-lg border border-[var(--border-subtle)] bg-[#020617] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Что нужно сделать…"
            />
          </label>

          <div className="flex flex-col gap-1 text-sm">
            <span>Дедлайн</span>
            <input
              type="datetime-local"
              className="rounded-lg border border-[var(--border-subtle)] bg-[#020617] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
            />
          </div>

          {formError && (
            <p className="text-sm text-red-500">{formError}</p>
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
