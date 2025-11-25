import React, { useEffect, useState } from "react";
import { fetchTasks, createTask } from "../../api/tasksApi";
import type { TaskUpsertPayload } from "../../api/tasksApi";
import type { Task } from "../../types/tasks";
import { Link } from "react-router-dom";
import {
  fetchExecutors,
  type ExecutorShort,
  createInvitation,
} from "../../api/authApi";

export const CreatorTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [executors, setExecutors] = useState<ExecutorShort[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- инвайты ---
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteInfo, setInviteInfo] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  // ----------------

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    assignee: "",
    due_at: "",
  });

  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTasks();
      setTasks(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ?? "Не удалось загрузить список задач"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadExecutors = async () => {
    try {
      const data = await fetchExecutors();
      setExecutors(data);
    } catch {
      // можно молча
    }
  };

  useEffect(() => {
    void loadTasks();
    void loadExecutors();
  }, []);

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const payload: TaskUpsertPayload = {
        title: form.title,
        description: form.description,
        priority: form.priority,
      };

      if (form.assignee) {
        payload.assignee = Number(form.assignee);
      }
      if (form.due_at) {
        const local = new Date(form.due_at);
        payload.due_at = local.toISOString();
      }

      await createTask(payload);
      setForm({
        title: "",
        description: "",
        priority: "medium",
        assignee: "",
        due_at: "",
      });
      await loadTasks();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ??
          "Ошибка при создании задачи. Проверьте поля."
      );
    } finally {
      setCreating(false);
    }
  };

  // --- обработка инвайта ---
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setInviteInfo(null);
    setInviteLoading(true);
    try {
      await createInvitation(inviteEmail);
      setInviteInfo(
        "Приглашение отправлено. Исполнителю придёт письмо с инструкцией."
      );
      setInviteEmail("");
      // после того как исполнитель подтвердит инвайт, он появится в списке executors
      await loadExecutors();
    } catch (err: any) {
      setInviteError(
        err?.response?.data?.detail ??
          err?.response?.data?.email ??
          "Не удалось создать приглашение."
      );
    } finally {
      setInviteLoading(false);
    }
  };
  // ---------------------------

  return (
    <div>
      <h1>Кабинет создателя</h1>

      {/* Блок инвайтов */}
      <section style={{ marginBottom: 24, padding: 12, border: "1px solid #ccc" }}>
        <h2>Пригласить исполнителя</h2>
        <form onSubmit={handleInviteSubmit}>
          <div>
            <label>Email исполнителя</label>
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </div>
          {inviteError && (
            <div style={{ color: "red", marginTop: 8 }}>{inviteError}</div>
          )}
          {inviteInfo && (
            <div style={{ color: "green", marginTop: 8 }}>{inviteInfo}</div>
          )}
          <button
            type="submit"
            disabled={inviteLoading}
            style={{ marginTop: 8 }}
          >
            {inviteLoading ? "Отправляем..." : "Отправить приглашение"}
          </button>
        </form>
        {executors.length > 0 && (
          <p style={{ marginTop: 8 }}>
            Уже есть исполнители: {executors.length} (см. список в выпадающем
            списке назначения задачи ниже).
          </p>
        )}
      </section>

      {/* Создание задачи */}
      <section style={{ marginBottom: 24 }}>
        <h2>Создать задачу</h2>
        <form onSubmit={handleCreateTask}>
          <div>
            <label>Название</label>
            <input
              name="title"
              value={form.title}
              onChange={handleFormChange}
              required
            />
          </div>
          <div>
            <label>Описание</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleFormChange}
              rows={3}
            />
          </div>
          <div>
            <label>Приоритет</label>
            <select
              name="priority"
              value={form.priority}
              onChange={handleFormChange}
            >
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
            </select>
          </div>
          <div>
            <label>Исполнитель</label>
            <select
              name="assignee"
              value={form.assignee}
              onChange={handleFormChange}
            >
              <option value="">— не назначен —</option>
              {executors.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.full_name} ({ex.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Дедлайн</label>
            <input
              type="datetime-local"
              name="due_at"
              value={form.due_at}
              onChange={handleFormChange}
            />
          </div>
          {error && (
            <div style={{ color: "red", marginTop: 8 }}>{error}</div>
          )}
          <button type="submit" disabled={creating} style={{ marginTop: 8 }}>
            {creating ? "Создаём..." : "Создать задачу"}
          </button>
        </form>
      </section>

      {/* Список задач */}
      <section>
        <h2>Мои задачи</h2>
        {loading && <div>Загрузка задач...</div>}
        {!loading && tasks.length === 0 && <div>Задач пока нет</div>}
        <ul>
          {tasks.map((t) => (
            <li key={t.id} style={{ marginBottom: 6 }}>
              <Link to={`/tasks/${t.id}`}>
                <strong>{t.title}</strong> — {t.status_display} —{" "}
                {t.assignee
                  ? `Исполнитель #${t.assignee}`
                  : "Исполнитель не назначен"}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
