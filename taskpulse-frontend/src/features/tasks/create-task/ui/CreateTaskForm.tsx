// src/features/tasks/create-task/ui/CreateTaskForm.tsx
import { useEffect, useState, type FormEvent } from "react";
import {
  useCreateTask,
  type CreateTaskPayload,
} from "../model/useCreateTask";
import { Input } from "../../../../shared/ui/Input";
import { Button } from "../../../../shared/ui/Button";
import { useExecutors } from "../../../users-management/executors-list/model/useExecutors";

interface CreateTaskFormProps {
  /** если передать — выберем исполнителя по умолчанию */
  assigneeId?: number | null;
  onCreated?: () => void;
}

export const CreateTaskForm = ({
  assigneeId = null,
  onCreated,
}: CreateTaskFormProps) => {
  const { data: executors, isLoading: executorsLoading } = useExecutors();
  const createTask = useCreateTask();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState<string>("");

  const [internalAssigneeId, setInternalAssigneeId] = useState<number | null>(
    assigneeId ?? null,
  );

  useEffect(() => {
    setInternalAssigneeId(assigneeId ?? null);
  }, [assigneeId]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!internalAssigneeId) return;

    const payload: CreateTaskPayload = {
      title: title.trim(),
      description: description.trim(),
      // приоритет больше не в форме, шьём «Средний» по умолчанию
      priority: "medium",
      assignee: internalAssigneeId,
      due_at: dueAt ? new Date(dueAt).toISOString() : null,
    };

    createTask.mutate(payload, {
      onSuccess: () => {
        setTitle("");
        setDescription("");
        setDueAt("");
        if (!assigneeId) {
          setInternalAssigneeId(null);
        }
        onCreated?.();
      },
    });
  };

  return (
    <div className="mt-8 rounded-2xl border border-[var(--border-subtle)] bg-[#020617] px-4 py-4 md:px-6 md:py-5">
      <h2 className="text-lg font-semibold">Создать задачу</h2>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        Заполните поля ниже, чтобы назначить новую задачу исполнителю.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-4 grid gap-3 md:grid-cols-2"
      >
        {/* Исполнитель */}
        <label className="flex flex-col gap-1 text-sm md:col-span-2">
          <span>Исполнитель</span>
          <select
            className="rounded-lg border border-[var(--border-subtle)] bg-[#020617] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            value={internalAssigneeId ?? ""}
            onChange={(e) =>
              setInternalAssigneeId(
                e.target.value ? Number(e.target.value) : null,
              )
            }
            disabled={executorsLoading || !!assigneeId}
          >
            <option value="">
              {executorsLoading
                ? "Загружаем исполнителей..."
                : "Выберите исполнителя…"}
            </option>
            {executors?.map((executor) => (
              <option key={executor.id} value={executor.id}>
                {executor.full_name || executor.email}
              </option>
            ))}
          </select>
        </label>

        {/* Название */}
        <Input
          label="Название задачи"
          placeholder="Кратко опишите, что нужно сделать…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {/* Дедлайн */}
        <label className="flex flex-col gap-1 text-sm">
          <span>Дедлайн</span>
          <input
            type="datetime-local"
            className="rounded-lg border border-[var(--border-subtle)] bg-[#020617] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
          />
        </label>

        {/* Описание */}
        <label className="flex flex-col gap-1 text-sm md:col-span-2">
          <span>Описание задачи</span>
          <textarea
            className="min-h-[80px] resize-y rounded-lg border border-[var(--border-subtle)] bg-[#020617] px-3 py-2 text-sm outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-secondary)]"
            placeholder="Подробно опишите задачу, чтобы исполнителю было проще"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        <div className="md:col-span-2 flex justify-end pt-1">
          <Button type="submit" loading={createTask.isPending}>
            Создать задачу
          </Button>
        </div>
      </form>
    </div>
  );
};
