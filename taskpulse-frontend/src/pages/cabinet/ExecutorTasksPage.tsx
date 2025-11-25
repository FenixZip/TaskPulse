import React, { useEffect, useState } from "react";
import { fetchTasks } from "../../api/tasksApi";
import type { Task } from "../../types/tasks";
import { Link } from "react-router-dom";

export const ExecutorTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTasks({ assignee: "me" });
      setTasks(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ?? "Не удалось загрузить список задач"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTasks();
  }, []);

  return (
    <div>
      <h1>Мои задачи</h1>
      {loading && <div>Загрузка...</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}
      {!loading && !error && tasks.length === 0 && (
        <div>Вам пока не назначены задачи.</div>
      )}

      <ul>
        {tasks.map((t) => (
          <li key={t.id} style={{ marginBottom: 6 }}>
            <Link to={`/tasks/${t.id}`}>
              <strong>{t.title}</strong> — {t.status_display} — до{" "}
              {t.due_at ? new Date(t.due_at).toLocaleString() : "без срока"}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
