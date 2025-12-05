// src/features/tasks/create/ui/CreateTaskModal.tsx
import { useState, type FormEvent } from "react";
import { useCreateTask, type CreateTaskPayload } from "../model/useCreateTask";
import { Input } from "../../../../shared/ui/Input";
import { Button } from "../../../../shared/ui/Button";

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
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueAt, setDueAt] = useState<string>("");

  const createTask = useCreateTask();

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!assigneeId) return;

    const payload: CreateTaskPayload = {
      title,
      description,
      priority,
      assignee: assigneeId,
      due_at: dueAt ? new Date(dueAt).toISOString() : null,
    };

    try {
      await createTask.mutateAsync(payload);
      setTitle("");
      setDescription("");
      setPriority("medium");
      setDueAt("");
      onClose();
    } catch {
      // можно добавить показ ошибки, если нужно
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Название задачи"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div>
            <label className="input-label mb-1 block">Описание</label>
            <textarea
              className="w-full rounded-xl bg-black/20 border border-[var(--border-subtle)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              rows={4}
              placeholder="Опишите, что нужно сделать"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="input-label mb-1 block">Приоритет</label>
              <select
                className="w-full rounded-xl bg-black/20 border border-[var(--border-subtle)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as "low" | "medium" | "high")
                }
              >
                <option value="low">Низкий</option>
                <option value="medium">Средний</option>
                <option value="high">Высокий</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="input-label mb-1 block">Крайний срок</label>
              <input
                type="datetime-local"
                className="w-full rounded-xl bg-black/20 border border-[var(--border-subtle)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
              />
            </div>
          </div>

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
