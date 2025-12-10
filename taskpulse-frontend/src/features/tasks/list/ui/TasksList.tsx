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

const getStatusLabel = (status: Task["status"]): string => {
  switch (status) {
    case "done":
      return "Выполнена";
    case "in_progress":
      return "В работе";
    case "overdue":
      return "Просрочена";
    case "new":
    default:
      return "Новая";
  }
};

const getCardColorClass = (task: Task): string => {
  const now = new Date();
  const dueAt = task.due_at ? new Date(task.due_at) : null;
  const isOverdueByDate =
    !!dueAt && !Number.isNaN(dueAt.getTime()) && dueAt.getTime() < now.getTime();
  const isOverdue =
    task.status === "overdue" ||
    (isOverdueByDate && task.status !== "done");

  if (task.status === "done") {
    // выполненная — зелёная
    return "task-card task-card--done";
  }

  if (isOverdue) {
    // просрочена — красная
    return "task-card task-card--overdue";
  }

  // новая / в работе — базовая светлая
  return "task-card task-card--new";
};

export const TasksList = ({ mode }: TasksListProps) => {
  const { data: tasks, isLoading, isError } = useTasks();
  const updateStatus = useUpdateTaskStatus();

  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (isLoading) {
    return <div className="tasks-empty">Загружаем задачи…</div>;
  }

  if (isError) {
    return (
      <div className="tasks-empty text-red-400">
        Не удалось загрузить список задач.
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return <div className="tasks-empty">Задач пока нет.</div>;
  }

  const personLabel = mode === "creator" ? "Исполнитель" : "Создатель";
  const hasSingleTask = tasks.length === 1;

  const toggleDetails = (taskId: number) => {
    setExpandedId((prev) => (prev === taskId ? null : taskId));
  };

  const handleMarkDone = (
    task: Task,
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.stopPropagation();
    if (task.status === "done") return;
    updateStatus.mutate({ taskId: task.id, status: "done" });
  };

  const handleOpenChat = (
    task: Task,
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.stopPropagation();

    const peerId =
      mode === "creator" ? task.assignee ?? null : task.creator ?? null;

    if (!peerId) return;

    // глобальное событие, которое ловит ExecutorsChatDock
    const event = new CustomEvent("open-chat-from-task", {
      detail: {
        peerId,
        taskId: task.id,
        taskTitle: task.title,
      },
    });

    window.dispatchEvent(event);
  };

  return (
    <div
      className={
        hasSingleTask ? "tasks-grid tasks-grid--single" : "tasks-grid"
      }
    >
      {tasks.map((task) => {
        const cardClass = getCardColorClass(task);
        const isExpanded = expandedId === task.id;

        const personName =
          mode === "creator"
            ? task.assignee_name || "Не указано"
            : task.creator_name || "Не указано";

        const personPosition =
          mode === "creator"
            ? task.assignee_position || "Не указано"
            : task.creator_position || "Не указано";

        return (
          <div
            key={task.id}
            className={cardClass}
            onClick={() => toggleDetails(task.id)}
          >
            {/* верх: ФИО + статус */}
            <div className="task-card__header">
              <div>
                <div className="task-card__label">{personLabel}</div>
                <div className="task-card__value task-card__value--name">
                  {personName}
                </div>
              </div>

              <div className="task-card__status-block">
                <div className="task-card__label">Статус</div>
                <div className="task-status-badge">
                  {getStatusLabel(task.status)}
                </div>
              </div>
            </div>

            {/* должность */}
            <div className="task-card__row">
              <span className="task-card__label">Должность</span>
              <span className="task-card__value">{personPosition}</span>
            </div>

            {/* название задачи */}
            <div className="task-card__row task-card__row--title">
              <span className="task-card__label">Название задачи</span>
              <span className="task-card__value">{task.title}</span>
            </div>

            {/* дедлайн */}
            <div className="task-card__row">
              <span className="task-card__label">Дедлайн</span>
              <span className="task-card__value">
                {formatDateTime(task.due_at)}
              </span>
            </div>

            {/* подробности по клику */}
            {isExpanded && (
              <div className="task-card__details">
                {task.description && (
                  <div className="task-card__row">
                    <span className="task-card__label">Описание</span>
                    <div className="task-card__value task-card__value--description">
                      {task.description}
                    </div>
                  </div>
                )}

                {task.priority && (
                  <div className="task-card__row">
                    <span className="task-card__label">Приоритет</span>
                    <span className="task-card__value">
                      {task.priority_display || task.priority}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* нижние кнопки */}
            <div className="task-card__footer">
              <Button
                type="button"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDetails(task.id);
                }}
              >
                {isExpanded ? "Скрыть" : "Подробнее"}
              </Button>

              <div className="task-card__footer-right">
                {mode === "executor" && task.status !== "done" && (
                  <Button
                    type="button"
                    variant="ghost"
                    loading={updateStatus.isPending}
                    onClick={(e) => handleMarkDone(task, e)}
                  >
                    Отметить выполненной
                  </Button>
                )}

                <Button
                  type="button"
                  variant="primary"
                  onClick={(e) => handleOpenChat(task, e)}
                >
                  Написать исполнителю
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
