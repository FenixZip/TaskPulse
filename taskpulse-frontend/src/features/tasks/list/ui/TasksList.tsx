// src/features/tasks/list/ui/TasksList.tsx
import { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTasks } from "../model/useTasks";
import { useUpdateTaskStatus } from "../../actions/model/useUpdateTaskStatus";
import type { Task, TaskPriority } from "../../../../entities/task/model/types";
import { Button } from "../../../../shared/ui/Button";
import { Input } from "../../../../shared/ui/Input";

interface TasksListProps {
  mode: "creator" | "executor";
}

type StatusFilter = "all" | "new" | "in_progress" | "done" | "overdue";
type SortKey = "none" | "due_at" | "priority";
type PriorityFilter = "all" | TaskPriority;

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "Без дедлайна";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const priorityWeight = (p: TaskPriority) => {
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
  const [priorityFilter, setPriorityFilter] =
    useState<PriorityFilter>("all");

  const [searchFio, setSearchFio] = useState("");
  const [searchCompany, setSearchCompany] = useState("");
  const [searchPosition, setSearchPosition] = useState("");
  const [searchDescription, setSearchDescription] = useState("");
  const [dueFrom, setDueFrom] = useState<string>("");
  const [dueTo, setDueTo] = useState<string>("");

  const handleMarkDone = (taskId: number) => {
    updateStatusMutation.mutate({ taskId, status: "done" });
  };

  const openChat = (task: Task, personName: string) => {
    const peerId = mode === "creator" ? task.assignee : task.creator;
    if (!peerId) return;

    const search = new URLSearchParams();
    search.set("name", personName);

    navigate(`/app/chat/${peerId}?${search.toString()}`);
  };

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];

    const fioQuery = searchFio.trim().toLowerCase();
    const companyQuery = searchCompany.trim().toLowerCase();
    const positionQuery = searchPosition.trim().toLowerCase();
    const descriptionQuery = searchDescription.trim().toLowerCase();

    const fromDate = dueFrom ? new Date(dueFrom) : null;
    const toDate = dueTo ? new Date(dueTo) : null;
    if (fromDate && !Number.isNaN(fromDate.getTime())) {
      fromDate.setHours(0, 0, 0, 0);
    }
    if (toDate && !Number.isNaN(toDate.getTime())) {
      toDate.setHours(23, 59, 59, 999);
    }

    return [...tasks]
      .filter((task) => {
        if (mode === "creator" && assigneeFilterFromUrl) {
          if (!task.assignee) return false;
          if (String(task.assignee) !== assigneeFilterFromUrl) return false;
        }

        if (statusFilter !== "all" && task.status !== statusFilter) {
          return false;
        }

        if (priorityFilter !== "all" && task.priority !== priorityFilter) {
          return false;
        }

        const personName =
          mode === "creator"
            ? task.assignee_name || ""
            : task.creator_name || "";
        const personPosition =
          mode === "creator"
            ? task.assignee_position || ""
            : task.creator_position || "";
        const personCompany =
          mode === "creator"
            ? task.assignee_company || ""
            : task.creator_company || "";

        if (fioQuery && !personName.toLowerCase().includes(fioQuery)) {
          return false;
        }

        if (
          companyQuery &&
          !personCompany.toLowerCase().includes(companyQuery)
        ) {
          return false;
        }

        if (
          positionQuery &&
          !personPosition.toLowerCase().includes(positionQuery)
        ) {
          return false;
        }

        if (
          descriptionQuery &&
          !(task.description || "")
            .toLowerCase()
            .includes(descriptionQuery)
        ) {
          return false;
        }

        if (fromDate || toDate) {
          if (!task.due_at) return false;
          const due = new Date(task.due_at);
          if (Number.isNaN(due.getTime())) return false;

          if (fromDate && due < fromDate) return false;
          if (toDate && due > toDate) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortKey === "none") return 0;

        if (sortKey === "due_at") {
          const aDate = a.due_at ? new Date(a.due_at).getTime() : Infinity;
          const bDate = b.due_at ? new Date(b.due_at).getTime() : Infinity;
          return aDate - bDate;
        }

        if (sortKey === "priority") {
          return priorityWeight(a.priority) - priorityWeight(b.priority);
        }

        return 0;
      });
  }, [
    tasks,
    mode,
    assigneeFilterFromUrl,
    statusFilter,
    sortKey,
    priorityFilter,
    searchFio,
    searchCompany,
    searchPosition,
    searchDescription,
    dueFrom,
    dueTo,
  ]);

  const renderPriorityBadge = (task: Task) => {
    const label =
      task.priority_display ||
      (task.priority === "high"
        ? "Высокий"
        : task.priority === "medium"
        ? "Средний"
        : "Низкий");

    let cls =
      "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ";

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
    const base =
      task.status_display ||
      (task.status === "done"
        ? "Выполнена"
        : task.status === "in_progress"
        ? "В работе"
        : task.status === "overdue"
        ? "Просрочена"
        : "Новая");

    let cls =
      "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ";

    if (task.status === "done") {
      cls += "bg-emerald-500/15 text-emerald-200 border border-emerald-500/40";
    } else if (task.status === "overdue") {
      cls += "bg-red-500/15 text-red-300 border border-red-500/40";
    } else {
      cls +=
        "bg-sky-500/15 text-sky-200 border border-sky-500/40";
    }

    return <span className={cls}>{base}</span>;
  };

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
        Не удалось загрузить задачи.
      </div>
    );
  }

  if (!filteredTasks.length) {
    return (
      <div className="mt-4 text-sm text-[var(--text-secondary)]">
        Задач по выбранным фильтрам нет.
      </div>
    );
  }

  return (
    <div className="tasks-root">
      {/* панель фильтров и сортировки */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
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

          <div className="flex flex-wrap gap-2 items-center text-xs">
            <label className="flex items-center gap-1">
              <span className="text-[var(--text-secondary)]">Приоритет:</span>
              <select
                className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 py-1 text-xs text-[var(--text-primary)]"
                value={priorityFilter}
                onChange={(e) =>
                  setPriorityFilter(e.target.value as PriorityFilter)
                }
              >
                <option value="all">Все</option>
                <option value="high">Высокий</option>
                <option value="medium">Средний</option>
                <option value="low">Низкий</option>
              </select>
            </label>

            <label className="flex items-center gap-1">
              <span className="text-[var(--text-secondary)]">Сортировка:</span>
              <select
                className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 py-1 text-xs text-[var(--text-primary)]"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
              >
                <option value="none">Без сортировки</option>
                <option value="due_at">По дедлайну</option>
                <option value="priority">По приоритету</option>
              </select>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            label="ФИО"
            placeholder="Фильтр по ФИО"
            value={searchFio}
            onChange={(e) => setSearchFio(e.target.value)}
          />
          <Input
            label="Компания"
            placeholder="Фильтр по компании"
            value={searchCompany}
            onChange={(e) => setSearchCompany(e.target.value)}
          />
          <Input
            label="Должность"
            placeholder="Фильтр по должности"
            value={searchPosition}
            onChange={(e) => setSearchPosition(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            label="По описанию задачи"
            placeholder="Текст в описании…"
            value={searchDescription}
            onChange={(e) => setSearchDescription(e.target.value)}
          />

          <label className="flex flex-col gap-1 text-sm">
            <span>Дедлайн: от</span>
            <input
              type="date"
              className="rounded-lg border bg-[#020617] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors border-[var(--border-subtle)] focus:border-[var(--accent)] placeholder:text-[var(--text-secondary)]"
              value={dueFrom}
              onChange={(e) => setDueFrom(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span>Дедлайн: до</span>
            <input
              type="date"
              className="rounded-lg border bg-[#020617] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors border-[var(--border-subtle)] focus:border-[var(--accent)] placeholder:text-[var(--text-secondary)]"
              value={dueTo}
              onChange={(e) => setDueTo(e.target.value)}
            />
          </label>
        </div>
      </div>

      {/* список задач */}
      <div className="space-y-3">
        {filteredTasks.map((task) => {
          const personName =
            mode === "creator"
              ? task.assignee_name || "Исполнитель не назначен"
              : task.creator_name || "Создатель не указан";
          const personPosition =
            mode === "creator"
              ? task.assignee_position
              : task.creator_position;

          const isDone = task.status === "done";

          return (
            <div
              key={task.id}
              className="rounded-2xl border border-[var(--border-subtle)]/60 bg-[var(--bg-elevated)]/30 px-4 py-3 hover:border-[var(--accent)]/60 transition-colors"
            >
              <div className="flex flex-col gap-2">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-sm">{task.title}</h3>
                      {renderPriorityBadge(task)}
                      {renderStatusLabel(task)}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      {mode === "creator" ? "Исполнитель" : "Создатель"}:{" "}
                      {personName}
                      {personPosition && ` • ${personPosition}`}
                    </p>
                  </div>

                  <div className="text-xs text-right text-[var(--text-secondary)]">
                    <div>Дедлайн: {formatDateTime(task.due_at)}</div>
                  </div>
                </div>

                {task.description && (
                  <p className="text-xs text-[var(--text-secondary)]">
                    {task.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => openChat(task, personName)}
                  >
                    Уточнить детали
                  </Button>

                  {mode === "executor" && !isDone && (
                    <Button
                      type="button"
                      onClick={() => handleMarkDone(task.id)}
                      loading={updateStatusMutation.isPending}
                    >
                      Отметить выполненной
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
