// src/features/tasks/list/ui/TasksList.tsx
import { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTasks } from "../model/useTasks";
import { useUpdateTaskStatus } from "../../actions/model/useUpdateTaskStatus";
import type { Task } from "../../../../entities/task/model/types";
import { Button } from "../../../../shared/ui/Button";

interface TasksListProps {
  mode: "creator" | "executor";
}

type StatusFilter = "all" | "new" | "in_progress" | "done" | "overdue";
type SortKey = "none" | "due_at" | "priority";

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "Без дедлайна";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const priorityWeight = (p: Task["priority"]) => {
  if (p === "high") return 3;
  if (p === "medium") return 2;
  if (p === "low") return 1;
  return 0;
};

export const TasksList = ({ mode }: TasksListProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: tasks, isLoading, isError } = useTasks();
  const updateStatusMutation = useUpdateTaskStatus();

  const searchParams = new URLSearchParams(location.search);
  const assigneeFilterFromUrl = searchParams.get("assignee");

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("none");

  const handleMarkDone = (taskId: number) => {
    updateStatusMutation.mutate({ taskId, status: "done" });
  };

  const openChat = (task: Task, personName: string) => {
    const peerId = mode === "creator" ? task.assignee : task.creator;
    if (!peerId) return;

    const search = new URLSearchParams();
    search.set("name", personName);
    search.set("taskTitle", task.title);

    navigate(`/app/chat/${peerId}?${search.toString()}`);
  };

  const openDetails = (task: Task) => {
    navigate(`/app/tasks/${task.id}`);
  };

  const filteredAndSortedTasks = useMemo(() => {
    if (!tasks) return [];

    return [...tasks]
      .filter((task) => {
        // фильтр по исполнителю (для создателя при клике "Показать задачи")
        if (assigneeFilterFromUrl && mode === "creator") {
          if (String(task.assignee) !== assigneeFilterFromUrl) {
            return false;
          }
        }

        if (statusFilter === "all") return true;
        return task.status === statusFilter;
      })
      .sort((a, b) => {
        if (sortKey === "none") return 0;

        if (sortKey === "due_at") {
          const da = a.due_at ? new Date(a.due_at).getTime() : Infinity;
          const db = b.due_at ? new Date(b.due_at).getTime() : Infinity;
          return da - db;
        }

        if (sortKey === "priority") {
          return priorityWeight(b.priority) - priorityWeight(a.priority);
        }

        return 0;
      });
  }, [tasks, statusFilter, sortKey, assigneeFilterFromUrl, mode]);

  const renderPriorityBadge = (task: Task) => {
    const label = task.priority_display
      ? task.priority_display
      : task.priority === "high"
      ? "Высокий"
      : task.priority === "medium"
      ? "Средний"
      : "Низкий";

    let cls =
      "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium";

    if (task.priority === "high") {
      cls += " bg-red-500/15 text-red-300 border border-red-500/40";
    } else if (task.priority === "medium") {
      cls +=
        " bg-amber-500/15 text-amber-200 border border-amber-500/40";
    } else {
      cls +=
        " bg-emerald-500/15 text-emerald-200 border border-emerald-500/40";
    }

    return <span className={cls}>Приоритет: {label}</span>;
  };

  const renderStatusLabel = (task: Task) => {
    const base = task.status_display
      ? task.status_display
      : task.status === "done"
      ? "Выполнена"
      : task.status === "in_progress"
      ? "В работе"
      : task.status === "overdue"
      ? "Просрочена"
      : "Новая";

    let cls =
      "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium";

    if (task.status === "done") {
      cls +=
        " bg-emerald-500/15 text-emerald-200 border border-emerald-500/40";
    } else if (task.status === "in_progress") {
      cls +=
        " bg-sky-500/15 text-sky-200 border border-sky-500/40";
    } else if (task.status === "overdue") {
      cls += " bg-red-500/20 text-red-300 border border-red-500/40";
    } else {
      cls +=
        " bg-slate-500/15 text-slate-200 border border-slate-500/40";
    }

    return <span className={cls}>{base}</span>;
  };

  if (isLoading) {
    return <div className="tasks-empty">Загружаем задачи…</div>;
  }

  if (isError) {
    return <div className="tasks-empty">Не удалось загрузить задачи.</div>;
  }

  if (!filteredAndSortedTasks.length) {
    return (
      <div className="tasks-empty">
        Задач пока нет — самое время поставить первую.
      </div>
    );
  }

  return (
    <div className="tasks-root">
      {/* панель фильтров и сортировки */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-2 py-1 rounded-full border ${
              statusFilter === "all"
                ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10"
                : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Все
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("new")}
            className={`px-2 py-1 rounded-full border ${
              statusFilter === "new"
                ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10"
                : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Новые
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("in_progress")}
            className={`px-2 py-1 rounded-full border ${
              statusFilter === "in_progress"
                ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10"
                : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            В работе
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("done")}
            className={`px-2 py-1 rounded-full border ${
              statusFilter === "done"
                ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10"
                : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Выполненные
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("overdue")}
            className={`px-2 py-1 rounded-full border ${
              statusFilter === "overdue"
                ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10"
                : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Просроченные
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[var(--text-secondary)]">Сортировать:</span>
          <select
            className="rounded-xl bg-black/20 border border-[var(--border-subtle)] px-2 py-1 text-xs outline-none focus:border-[var(--accent)]"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
          >
            <option value="none">Без сортировки</option>
            <option value="due_at">По дедлайну</option>
            <option value="priority">По приоритету</option>
          </select>
        </div>
      </div>

      <div className="tasks-list space-y-3">
        {filteredAndSortedTasks.map((task: Task) => {
          const isDone = task.status === "done";

          const personLabel =
            mode === "creator"
              ? task.assignee_name || "Исполнитель не назначен"
              : task.creator_name || "Создатель не указан";

          const personPosition =
            mode === "creator"
              ? task.assignee_position
              : task.creator_position;

          const peerId = mode === "creator" ? task.assignee : task.creator;

          return (
            <div
              key={task.id}
              className="rounded-2xl border border-[var(--border-subtle)] bg-black/30 px-4 py-3 hover:border-[var(--accent)]/60 transition-colors"
            >
              <div className="flex flex-col gap-2 md:flex-row md:justify-between">
                <div>
                  <div className="text-xs text-[var(--text-secondary)] mb-1">
                    {mode === "creator" ? "Исполнитель: " : "Создатель: "}
                    <strong className="text-[var(--text-primary)]">
                      {personLabel}
                    </strong>
                    {personPosition ? ` — ${personPosition}` : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => openDetails(task)}
                    className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent)]"
                  >
                    {task.title}
                  </button>

                  {task.description && (
                    <div className="text-xs text-[var(--text-secondary)] mt-1">
                      {task.description}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {renderPriorityBadge(task)}
                    <span className="text-[11px] text-[var(--text-secondary)]">
                      Дедлайн: {formatDateTime(task.due_at)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-start md:items-end gap-2 mt-2 md:mt-0">
                  <div>{renderStatusLabel(task)}</div>

                  <div className="flex gap-2">
                    {peerId && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => openChat(task, personLabel)}
                      >
                        Уточнить детали
                      </Button>
                    )}

                    {mode === "executor" && !isDone && (
                      <Button
                        variant="ghost"
                        onClick={() => handleMarkDone(task.id)}
                        loading={updateStatusMutation.isPending}
                      >
                        Отметить выполненной
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
