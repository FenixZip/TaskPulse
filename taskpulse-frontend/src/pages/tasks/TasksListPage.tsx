import React, { useEffect, useState } from "react";
import { fetchTasks } from "../../api/tasksApi";
import type { Task } from "../../types/tasks";
import { Link } from "react-router-dom";

export const TasksListPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchTasks({ search });
      setTasks(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load();
  };

  return (
    <div>
      <h1>Задачи</h1>
      <form onSubmit={handleSearch} style={{ marginBottom: 16 }}>
        <input
          placeholder="Поиск по названию"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit">Искать</button>
      </form>

      {loading && <div>Загрузка...</div>}

      {!loading && tasks.length === 0 && <div>Задач пока нет</div>}

      <ul>
        {tasks.map((t) => (
          <li key={t.id} style={{ marginBottom: 8 }}>
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
