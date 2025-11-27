// src/features/tasks/list/ui/TasksList.tsx
import { useTasks } from "../model/useTasks";
import { useUpdateTaskStatus } from "../../actions/model/useUpdateTaskStatus";
import type { Task } from "../../../../entities/task/model/types";
import { Button } from "../../../../shared/ui/Button";

interface TasksListProps {
  mode: "creator" | "executor";
}

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "Без дедлайна";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const renderPriorityBadge = (task: Task) => {
  const label = task.priority_display
    ? task.priority_display
    : task.priority === "high"
    ? "Высокий"
    : task.priority === "medium"
    ? "Средний"
    : "Низкий";

  const priorityClass =
    task.priority === "high"
      ? "task-badge-priority-high"
      : task.priority === "medium"
      ? "task-badge-priority-medium"
      : "task-badge-priority-low";

  return <span className={`task-badge ${priorityClass}`}>Приоритет: {label}</span>;
};

const renderStatusLabel = (task: Task) => {
  const base = task.status_display
    ? task.status_display
    : task.status === "done"
    ? "Выполнена"
    : task.status === "in_progress"
    ? "В работе"
    : "Новая";

  const cls =
    task.status === "done"
      ? "task-status-done"
      : task.status === "in_progress"
      ? "task-status-in-progress"
      : "task-status-new";

  return <span className={`task-status-value ${cls}`}>{base}</span>;
};

export const TasksList = ({ mode }: TasksListProps) => {
  const { data: tasks, isLoading, isError } = useTasks();
  const updateStatusMutation = useUpdateTaskStatus();

  const handleMarkDone = (taskId: number) => {
    updateStatusMutation.mutate({ taskId, status: "done" });
  };

  if (isLoading) {
    return <div className="tasks-empty">Загружаем задачи...</div>;
  }

  if (isError) {
    return <div className="tasks-empty">Не удалось загрузить задачи.</div>;
  }

  if (!tasks || tasks.length === 0) {
    return <div className="tasks-empty">Задач нет.</div>;
  }

  return (
    <div className="tasks-root">
      <div className="tasks-list">
        {tasks.map((task: Task) => {
          const isDone = task.status === "done";

          const personLabel =
            mode === "creator"
              ? task.assignee_name || "Исполнитель не назначен"
              : task.creator_name || "Создатель не указан";

          const personPosition =
            mode === "creator" ? task.assignee_position : task.creator_position;

          return (
            <div key={task.id} className="task-card">
              <div className="task-card-header">
                <div className="task-person">
                  {mode === "creator" ? "Исполнитель: " : "Создатель: "}
                  <strong>{personLabel}</strong>
                  {personPosition ? ` — ${personPosition}` : null}
                </div>

                <div className="task-card-title">{task.title}</div>
                {task.description && (
                  <div className="task-card-description">{task.description}</div>
                )}

                <div className="task-card-meta">
                  {renderPriorityBadge(task)}
                  <span className="task-badge">
                    Дедлайн: {formatDateTime(task.due_at)}
                  </span>
                </div>
              </div>

              <div className="task-status-row">
                <div>
                  <div className="task-status-label">Результат:</div>
                  {renderStatusLabel(task)}
                </div>

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
          );
        })}
      </div>
    </div>
  );
};
