// src/pages/tasks/TaskDetailsPage.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useTasks } from "../../features/tasks/list/model/useTasks";
import { useUpdateTaskStatus } from "../../features/tasks/actions/model/useUpdateTaskStatus";
import type { Task } from "../../entities/task/model/types";
import { Button } from "../../shared/ui/Button";

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "Без дедлайна";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

export const TaskDetailsPage = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { data: tasks, isLoading, isError } = useTasks();
  const updateStatusMutation = useUpdateTaskStatus();

  const task: Task | undefined = tasks?.find(
    (t) => t.id === Number(taskId)
  );

  const handleMarkDone = () => {
    if (!task) return;
    updateStatusMutation.mutate({ taskId: task.id, status: "done" });
  };

  const openChat = () => {
    if (!task) return;
    const peerId = task.assignee ?? task.creator;
    const peerName = task.assignee_name || task.creator_name || "Собеседник";

    if (!peerId) return;

    const search = new URLSearchParams();
    search.set("name", peerName);
    search.set("taskTitle", task.title);
    search.set("taskId", String(task.id));

    navigate(`/app/chat/${peerId}?${search.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="page">
        <p>Загружаем задачу…</p>
      </div>
    );
  }

  if (isError || !task) {
    return (
      <div className="page">
        <p>Не удалось загрузить задачу.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <Button
        variant="ghost"
        type="button"
        onClick={() => navigate(-1)}
        className="mb-3"
      >
        ← Назад
      </Button>

      <h1 className="page-title">{task.title}</h1>

      <div className="mt-2 text-sm text-[var(--text-secondary)] space-y-1">
        <div>
          Постановщик:{" "}
          <strong>{task.creator_name || "Не указан"}</strong>
        </div>
        <div>
          Исполнитель:{" "}
          <strong>{task.assignee_name || "Не назначен"}</strong>
        </div>
        <div>Дедлайн: {formatDateTime(task.due_at)}</div>
      </div>

      {task.description && (
        <div className="mt-4 text-sm text-[var(--text-primary)]">
          <h2 className="font-semibold mb-1">Описание</h2>
          <p className="whitespace-pre-wrap">{task.description}</p>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <Button type="button" variant="ghost" onClick={openChat}>
          Открыть чат по задаче
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={handleMarkDone}
          loading={updateStatusMutation.isPending}
        >
          Отметить выполненной
        </Button>
      </div>
    </div>
  );
};
