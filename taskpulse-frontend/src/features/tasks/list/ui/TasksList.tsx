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

type PriorityFilter = "all" | TaskPriority;

const formatDateTime = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getPriorityLabel = (priority: TaskPriority) => {
  if (priority === "high") return "Высокий";
  if (priority === "medium") return "Средний";
  return "Низкий";
};

const PriorityBadge = ({ priority }: { priority: TaskPriority }) => {
  let cls =
    "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ";

  if (priority === "high") {
    cls += "bg-red-500/15 text-red-200 border border-red-500/40";
  } else if (priority === "medium") {
    cls += "bg-yellow-500/15 text-yellow-200 border border-yellow-500/40";
  } else {
    cls += "bg-emerald-500/15 text-emerald-200 border border-emerald-500/40";
  }

  return <span className={cls}>{getPriorityLabel(priority)}</span>;
};

const StatusBadge = ({ status }: { status: Task["status"] }) => {
  let label = "Новая";
  let cls =
    "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ";

  if (status === "done") {
    label = "Выполнена";
    cls += "bg-emerald-500/15 text-emerald-200 border border-emerald-500/40";
  } else if (status === "in_progress") {
    label = "В работе";
    cls += "bg-sky-500/15 text-sky-200 border border-sky-500/40";
  } else if (status === "overdue") {
    label = "Просрочена";
    cls += "bg-red-500/15 text-red-200 border border-red-500/40";
  } else {
    cls += "bg-zinc-500/15 text-zinc-200 border border-zinc-500/40";
  }

  return <span className={cls}>{label}</span>;
};

export const TasksList = ({ mode }: TasksListProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: tasks, isLoading, isError } = useTasks();
  const updateStatusMutation = useUpdateTaskStatus();

  const searchParams = new URLSearchParams(location.search);
  const assigneeFilterFromUrl = searchParams.get("assignee");

  // фильтры, которые ты просил
  const [fioQuery, setFioQuery] = useState("");
  const [titleQuery, setTitleQuery] = useState("");
  const [priorityFilter, setPriorityFilter] =
    useState<PriorityFilter>("all");

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];

    const fioQ = fioQuery.trim().toLowerCase();
    const titleQ = titleQuery.trim().toLowerCase();

    return tasks.filter((task) => {
      // фильтр по исполнителю из query (?assignee=)
      if (mode === "creator" && assigneeFilterFromUrl) {
        if (!task.assignee) return false;
        if (String(task.assignee) !== assigneeFilterFromUrl) {
          return false;
        }
      }

      if (
        priorityFilter !== "all" &&
        task.priority !== priorityFilter
      ) {
        return false;
      }

      const personName =
        mode === "creator"
          ? task.assignee_name || ""
          : task.creator_name || "";

      if (fioQ && !personName.toLowerCase().includes(fioQ)) {
        return false;
      }

      if (
        titleQ &&
        !task.title.toLowerCase().includes(titleQ)
      ) {
        return false;
      }

      return true;
    });
  }, [tasks, mode, assigneeFilterFromUrl, fioQuery, titleQuery, priorityFilter]);

  const handleOpenTask = (taskId: number) => {
    navigate(`/app/tasks/${taskId}`);
  };

  const handleMarkDone = (taskId: number) => {
    updateStatusMutation.mutate({ taskId, status: "done" });
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

  if (!tasks || !tasks.length) {
    return (
      <div className="mt-4 text-sm text-[var(--text-secondary)]">
        Задач пока нет.
      </div>
    );
  }

  const personColumnTitle =
    mode === "creator" ? "Исполнитель" : "Создатель";

  return (
    <div className="mt-4">
      {/* Фильтры: ФИО, название, приоритет */}
      <div className="grid gap-3 md:grid-cols-3">
        <Input
          label="ФИО"
          placeholder="Фильтр по ФИО"
          value={fioQuery}
          onChange={(e) => setFioQuery(e.target.value)}
        />
        <Input
          label="Название задачи"
          placeholder="Фильтр по названию"
          value={titleQuery}
          onChange={(e) => setTitleQuery(e.target.value)}
        />
        <label className="flex flex-col gap-1 text-sm">
          <span>Приоритет</span>
          <select
            className="rounded-lg border bg-[#020617] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors border-[var(--border-subtle)] focus:border-[var(--accent)]"
            value={priorityFilter}
            onChange={(e) =>
              setPriorityFilter(e.target.value as PriorityFilter)
            }
          >
            <option value="all">Все приоритеты</option>
            <option value="high">Высокий</option>
            <option value="medium">Средний</option>
            <option value="low">Низкий</option>
          </select>
        </label>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="mt-4 text-sm text-[var(--text-secondary)]">
          Задачи не найдены по текущим фильтрам.
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm border border-[var(--border-subtle)] rounded-2xl overflow-hidden">
            <thead className="text-xs uppercase text-[var(--text-secondary)] border-b border-[var(--border-subtle)] bg-black/30">
              <tr>
                <th className="px-3 py-2 text-left">Название</th>
                <th className="px-3 py-2 text-left">
                  {personColumnTitle}
                </th>
                <th className="px-3 py-2 text-left">Приоритет</th>
                <th className="px-3 py-2 text-left">Статус</th>
                <th className="px-3 py-2 text-left">Дедлайн</th>
                <th className="px-3 py-2 text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => {
                const personName =
                  mode === "creator"
                    ? task.assignee_name || "Не указано"
                    : task.creator_name || "Не указано";

                const personCompany =
                  mode === "creator"
                    ? task.assignee_company
                    : task.creator_company;

                const personPosition =
                  mode === "creator"
                    ? task.assignee_position
                    : task.creator_position;

                return (
                  <tr
                    key={task.id}
                    className="border-b border-[var(--border-subtle)] last:border-b-0"
                  >
                    <td className="px-3 py-2 align-top">
                      <button
                        type="button"
                        className="text-left text-[var(--text-primary)] hover:text-[var(--accent)] underline-offset-2 hover:underline"
                        onClick={() => handleOpenTask(task.id)}
                      >
                        {task.title}
                      </button>
                      {task.description && (
                        <p className="mt-1 text-xs text-[var(--text-secondary)] line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <div className="text-sm">{personName}</div>
                      {(personCompany || personPosition) && (
                        <div className="text-xs text-[var(--text-secondary)]">
                          {personCompany}
                          {personCompany && personPosition && " · "}
                          {personPosition}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="px-3 py-2 align-top">
                      {formatDateTime(task.due_at)}
                    </td>
                    <td className="px-3 py-2 text-right align-top space-x-1">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => handleOpenTask(task.id)}
                      >
                        Открыть
                      </Button>
                      {mode === "executor" &&
                        task.status !== "done" && (
                          <Button
                            type="button"
                            variant="ghost"
                            loading={updateStatusMutation.isPending}
                            onClick={() => handleMarkDone(task.id)}
                          >
                            Отметить выполненной
                          </Button>
                        )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
