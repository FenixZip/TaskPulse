// src/features/tasks/list/ui/TasksList.tsx
import { useState } from "react";
import { useTasks } from "../model/useTasks";
import { useUpdateTaskStatus } from "../../actions/model/useUpdateTaskStatus";
import type { Task } from "../../../../entities/task/model/types";
import { Button } from "../../../../shared/ui/Button";

interface TasksListProps {
  mode: "creator" | "executor";
}

const formatDateTime = (value: string | null) => {
  if (!value) return "Не указано";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Не указано";

  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const StatusBadge = ({ status }: { status: Task["status"] }) => {
  let label = "Новая";
  let cls =
    "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ";

  if (status === "done") {
    label = "Выполнена";
    cls += "bg-emerald-500/15 text-emerald-100 border border-emerald-500/60";
  } else if (status === "in_progress") {
    label = "В работе";
    cls += "bg-sky-500/15 text-sky-100 border border-sky-500/60";
  } else if (status === "overdue") {
    label = "Просрочена";
    cls += "bg-red-500/15 text-red-100 border border-red-500/60";
  } else {
    cls += "bg-zinc-500/15 text-zinc-100 border border-zinc-500/60";
  }

  return <span className={cls}>{label}</span>;
};

const PriorityLabel = ({ priority }: { priority: Task["priority"] }) => {
  if (priority === "high") return <>Высокий</>;
  if (priority === "medium") return <>Средний</>;
  return <>Низкий</>;
};

const getCardClasses = (task: Task) => {
  const base =
    "rounded-2xl border px-4 py-3 md:px-5 md:py-4 cursor-pointer transition-colors select-none";

  const now = new Date();
  const dueAt = task.due_at ? new Date(task.due_at) : null;
  const isOverdueByDate =
    !!dueAt && !Number.isNaN(dueAt.getTime()) && dueAt.getTime() < now.getTime();
  const isOverdue =
    task.status === "overdue" ||
    (isOverdueByDate && task.status !== "done");

  if (task.status === "done") {
    // зелёная карта
    return (
      base +
      " bg-emerald-900/20 border-emerald-500/70 hover:bg-emerald-900/40"
    );
  }

  if (isOverdue) {
    // красная карта
    return (
      base +
      " bg-red-900/20 border-red-500/70 hover:bg-red-900/40"
    );
  }

  // обычная тёмная / «белая» по смыслу
  return (
    base +
    " bg-[#020617] border-[var(--border-subtle)] hover:bg-zinc-900/60"
  );
};

export const TasksList = ({ mode }: TasksListProps) => {
  const { data: tasks, isLoading, isError } = useTasks();
  const updateStatusMutation = useUpdateTaskStatus();

  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="mt-4 text-sm text-[var(--text-secondary)]">
        Загружаем задачи…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mt-4 text-sm text-red-400">
        Не удалось загрузить список задач.
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="mt-4 text-sm text-[var(--text-secondary)]">
        Задач пока нет.
      </div>
    );
  }

  const personLabel = mode === "creator" ? "Исполнитель" : "Создатель";

  const handleToggle = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleMarkDone = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    updateStatusMutation.mutate({ taskId: id, status: "done" });
  };

  return (
    <div className="mt-4 space-y-3">
      {tasks.map((task) => {
        const isExpanded = expandedId === task.id;

        const personName =
          mode === "creator"
            ? task.assignee_name || "Не указано"
            : task.creator_name || "Не указано";

        const dueLabel = formatDateTime(task.due_at);

        return (
          <div
            key={task.id}
            className={getCardClasses(task)}
            onClick={() => handleToggle(task.id)}
          >
            {/* Верхняя строка — только то, что ты просил */}
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col">
                <span className="text-xs uppercase text-[var(--text-secondary)]">
                  {personLabel}
                </span>
                <span className="text-sm md:text-base font-medium">
                  {personName}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 md:justify-end">
                <div className="flex flex-col">
                  <span className="text-xs uppercase text-[var(--text-secondary)]">
                    Дедлайн
                  </span>
                  <span className="text-sm md:text-base">
                    {dueLabel}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs uppercase text-[var(--text-secondary)]">
                    Статус
                  </span>
                  <StatusBadge status={task.status} />
                </div>
              </div>
            </div>

            {/* При клике — раскрываем дополнительные детали */}
            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-white/5 space-y-2 text-sm">
                <div>
                  <span className="text-xs uppercase text-[var(--text-secondary)]">
                    Название
                  </span>
                  <div className="mt-1 text-[var(--text-primary)]">
                    {task.title}
                  </div>
                </div>

                {task.description && (
                  <div>
                    <span className="text-xs uppercase text-[var(--text-secondary)]">
                      Описание
                    </span>
                    <div className="mt-1 text-[var(--text-primary)] whitespace-pre-line">
                      {task.description}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-4">
                  <div>
                    <span className="text-xs uppercase text-[var(--text-secondary)]">
                      Приоритет
                    </span>
                    <div className="mt-1">
                      <PriorityLabel priority={task.priority} />
                    </div>
                  </div>
                  {task.priority_display && (
                    <div>
                      <span className="text-xs uppercase text-[var(--text-secondary)]">
                        Приоритет (от сервера)
                      </span>
                      <div className="mt-1">
                        {task.priority_display}
                      </div>
                    </div>
                  )}
                </div>

                {mode === "executor" && task.status !== "done" && (
                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      loading={updateStatusMutation.isPending}
                      onClick={(e) => handleMarkDone(task.id, e)}
                    >
                      Отметить выполненной
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
