// src/pages/tasks/TaskDetailPage.tsx

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { Task, TaskMessage } from "../../types/tasks";
import {
  fetchTask,
  uploadTaskAttachment,
  updateTask,
  confirmTaskOnTime,
  requestTaskExtension,
  fetchConversationMessages,
  sendConversationMessage,
} from "../../api/tasksApi";
import { useAuth } from "../../hooks/useAuth";

export const TaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);

  const [savingComment, setSavingComment] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [extending, setExtending] = useState(false);

  const [executorComment, setExecutorComment] = useState("");
  const [extensionComment, setExtensionComment] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // чат
  const [otherUserId, setOtherUserId] = useState<number | null>(null);
  const [messages, setMessages] = useState<TaskMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatText, setChatText] = useState("");
  const [chatFile, setChatFile] = useState<File | null>(null);

  const loadTask = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTask(Number(id));
      setTask(data);
      setExecutorComment(data.executor_comment ?? "");
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ?? "Не удалось загрузить задачу."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTask();
  }, [id]);

  // загрузка чата, когда известны и task, и user
  const loadChat = async (otherId: number, taskId: number) => {
    setChatLoading(true);
    setChatError(null);
    try {
      const all = await fetchConversationMessages({ user_id: otherId });
      const filtered = all.filter((m) => m.task === taskId);
      setMessages(filtered);
    } catch (err: any) {
      setChatError(
        err?.response?.data?.detail ?? "Не удалось загрузить сообщения."
      );
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    if (!task || !user) return;
    let other: number | null = null;
    if (user.id === task.creator && task.assignee) {
      other = task.assignee;
    } else if (task.assignee && user.id === task.assignee) {
      other = task.creator;
    }
    setOtherUserId(other);
    if (other) {
      void loadChat(other, task.id);
    }
  }, [task, user]);

  const handleAttachmentChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!id || !e.target.files?.[0]) return;
    try {
      await uploadTaskAttachment(Number(id), e.target.files[0]);
      await loadTask();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ?? "Ошибка при загрузке вложения."
      );
    }
  };

  const isExecutor =
    user && task && task.assignee !== null && task.assignee === user.id;
  const isCreator = user && task && task.creator === user.id;

  // --- действия исполнителя ---

  const handleSaveExecutorComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSavingComment(true);
    setError(null);
    setInfo(null);
    try {
      const updated = await updateTask(Number(id), {
        executor_comment: executorComment,
      });
      setTask(updated);
      setInfo("Комментарий исполнителя сохранён.");
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ??
          "Не удалось сохранить комментарий исполнителя."
      );
    } finally {
      setSavingComment(false);
    }
  };

  const handleMarkDone = async () => {
    if (!id) return;
    setError(null);
    setInfo(null);
    try {
      const updated = await updateTask(Number(id), { status: "done" });
      setTask(updated);
      setInfo("Задача помечена как выполненная.");
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ?? "Не удалось изменить статус задачи."
      );
    }
  };

  const handleConfirmOnTime = async () => {
    if (!id) return;
    setConfirming(true);
    setError(null);
    setInfo(null);
    try {
      const updated = await confirmTaskOnTime(Number(id));
      setTask(updated);
      setInfo("Вы подтвердили, что успеете выполнить задачу в срок.");
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ??
          "Не удалось отправить подтверждение по срокам."
      );
    } finally {
      setConfirming(false);
    }
  };

  const handleRequestExtension = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !task) return;
    if (!extensionComment.trim()) {
      setError("Добавьте комментарий, почему нужен перенос срока.");
      return;
    }
    setExtending(true);
    setError(null);
    setInfo(null);
    try {
      const updated = await requestTaskExtension(
        Number(id),
        extensionComment.trim()
      );
      setTask(updated);
      setExtensionComment("");
      setInfo("Запрос на перенос срока отправлен (дедлайн +1 день).");
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ??
          "Не удалось отправить запрос на перенос срока."
      );
    } finally {
      setExtending(false);
    }
  };

  // --- чат ---

  const handleChatFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setChatFile(f);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !otherUserId) return;
    if (!chatText.trim() && !chatFile) return;

    setChatError(null);
    try {
      const msg = await sendConversationMessage({
        user_id: otherUserId,
        task: task.id,
        text: chatText.trim() || undefined,
        file: chatFile || undefined,
      });
      if (msg.task === task.id) {
        setMessages((prev) => [...prev, msg]);
      }
      setChatText("");
      setChatFile(null);
    } catch (err: any) {
      setChatError(
        err?.response?.data?.detail ?? "Не удалось отправить сообщение."
      );
    }
  };

  if (loading || !task) return <div>Загрузка...</div>;

  return (
    <div>
      <h1>{task.title}</h1>
      <p>{task.description}</p>

      <p>
        <strong>Статус:</strong> {task.status_display} |{" "}
        <strong>Приоритет:</strong> {task.priority_display}
      </p>
      <p>
        <strong>Дедлайн:</strong>{" "}
        {task.due_at ? new Date(task.due_at).toLocaleString() : "без срока"}
      </p>
      <p>
        <strong>Создатель:</strong> {task.creator_name} (id: {task.creator})
      </p>
      <p>
        <strong>Исполнитель:</strong>{" "}
        {task.assignee ? `id: ${task.assignee}` : "не назначен"}
      </p>

      {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
      {info && <div style={{ color: "green", marginTop: 8 }}>{info}</div>}

      {/* Вложения */}
      <section style={{ marginTop: 16 }}>
        <h3>Вложения</h3>
        {task.attachments.length === 0 && <div>Вложений нет.</div>}
        <ul>
          {task.attachments.map((a) => (
            <li key={a.id}>
              <a href={a.file_url} target="_blank" rel="noreferrer">
                {a.file}
              </a>
            </li>
          ))}
        </ul>
        <div style={{ marginTop: 8 }}>
          <label>
            Добавить вложение:{" "}
            <input type="file" onChange={handleAttachmentChange} />
          </label>
        </div>

        {task.result_file && (
          <div style={{ marginTop: 8 }}>
            <strong>Результат:</strong>{" "}
            <a href={task.result_file} target="_blank" rel="noreferrer">
              скачать
            </a>
          </div>
        )}
      </section>

      {/* Блок исполнителя */}
      {isExecutor && (
        <section style={{ marginTop: 24 }}>
          <h2>Действия исполнителя</h2>

          {/* комментарий исполнителя */}
          <form onSubmit={handleSaveExecutorComment}>
            <div>
              <label>Комментарий исполнителя</label>
              <textarea
                value={executorComment}
                onChange={(e) => setExecutorComment(e.target.value)}
                rows={3}
                style={{ width: "100%" }}
              />
            </div>
            <button
              type="submit"
              disabled={savingComment}
              style={{ marginTop: 8 }}
            >
              {savingComment ? "Сохраняем..." : "Сохранить комментарий"}
            </button>
          </form>

          {/* статус done */}
          <div style={{ marginTop: 16 }}>
            <button onClick={handleMarkDone}>Отметить как выполненную</button>
          </div>

          {/* подтверждение срока */}
          <div style={{ marginTop: 16 }}>
            <button onClick={handleConfirmOnTime} disabled={confirming}>
              {confirming ? "Отправляем..." : "Подтвердить, что успею в срок"}
            </button>
          </div>

          {/* запрос продления */}
          <section style={{ marginTop: 16 }}>
            <h3>Запросить перенос срока (+1 день)</h3>
            <form onSubmit={handleRequestExtension}>
              <div>
                <label>Комментарий к запросу</label>
                <textarea
                  value={extensionComment}
                  onChange={(e) => setExtensionComment(e.target.value)}
                  rows={3}
                  style={{ width: "100%" }}
                />
              </div>
              <button
                type="submit"
                disabled={extending}
                style={{ marginTop: 8 }}
              >
                {extending ? "Отправляем..." : "Запросить перенос"}
              </button>
            </form>
          </section>
        </section>
      )}

      {/* Создатель видит комментарий исполнителя */}
      {isCreator && !isExecutor && (
        <section style={{ marginTop: 24 }}>
          <h2>Информация исполнителя</h2>
          <p>
            <strong>Комментарий исполнителя:</strong>{" "}
            {task.executor_comment || "нет комментария"}
          </p>
        </section>
      )}

      {/* Чат */}
      {otherUserId && (
        <section style={{ marginTop: 32 }}>
          <h2>Чат по задаче</h2>
          {chatLoading && <div>Загрузка сообщений...</div>}
          {chatError && (
            <div style={{ color: "red", marginBottom: 8 }}>{chatError}</div>
          )}

          <div
            style={{
              border: "1px solid #ccc",
              padding: 8,
              maxHeight: 300,
              overflowY: "auto",
              marginBottom: 8,
            }}
          >
            {messages.length === 0 && <div>Сообщений пока нет.</div>}
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  marginBottom: 6,
                  textAlign: m.is_from_creator ? "left" : "right",
                }}
              >
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  {m.sender_name} •{" "}
                  {new Date(m.created_at).toLocaleString()}
                </div>
                <div>{m.text}</div>
                {m.file_url && (
                  <div>
                    <a href={m.file_url} target="_blank" rel="noreferrer">
                      файл
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage}>
            <div>
              <textarea
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                rows={2}
                style={{ width: "100%" }}
                placeholder="Сообщение..."
              />
            </div>
            <div style={{ marginTop: 4 }}>
              <input type="file" onChange={handleChatFileChange} />
            </div>
            <button type="submit" style={{ marginTop: 8 }}>
              Отправить
            </button>
          </form>
        </section>
      )}
    </div>
  );
};
