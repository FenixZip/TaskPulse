import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useLocation } from "react-router-dom";

import styles from "./ExecutorsChatDock.module.css";

import { useAuth } from "../../../../shared/hooks/useAuth";
import { Input } from "../../../../shared/ui/Input";
import { Button } from "../../../../shared/ui/Button";
import { useTaskChat, type ChatMessage } from "../../../chat/task-chat/model/useTaskChat";
import { useTasks } from "../../../tasks/list/model/useTasks";
import { useExecutors, type Executor } from "../model/useExecutors";
import type { Task } from "../../../../entities/task/model/types";

type NormalizedRole = "creator" | "executor" | null;

const normalizeRole = (value: string | null | undefined): NormalizedRole => {
  if (!value) return null;
  if (value === "CREATOR" || value === "creator") return "creator";
  if (value === "EXECUTOR" || value === "executor") return "executor";
  return null;
};

interface PeerInfo {
  id: number;
  name: string;
  sub?: string | null;
}

interface OpenChatFromTaskDetail {
  peerId: number;
  taskId?: number;
  taskTitle?: string;
}

export const ExecutorsChatDock = () => {
  const location = useLocation();
  const { auth } = useAuth();
  const role = normalizeRole(auth.user?.role);

  // Рендерим dock только внутри /app (чтобы не мешал гостевым страницам)
  if (!role || !location.pathname.startsWith("/app")) return null;

  const [isOpen, setIsOpen] = useState(false);
  const [peerId, setPeerId] = useState<number | null>(null);
  const [text, setText] = useState("");

  const [taskContextId, setTaskContextId] = useState<number | null>(null);
  const [taskContextTitle, setTaskContextTitle] = useState<string | null>(null);

  const {
    data: executors = [],
    isLoading: isExecutorsLoading,
    isError: isExecutorsError,
  } = useExecutors();

  const {
    data: tasks = [],
    isLoading: isTasksLoading,
    isError: isTasksError,
  } = useTasks();

  const peers: PeerInfo[] = useMemo(() => {
    if (role === "creator") {
      return (executors as Executor[]).map((ex) => ({
        id: ex.id,
        name: ex.full_name || ex.email || `Исполнитель #${ex.id}`,
        sub: ex.position || ex.company || null,
      }));
    }

    // executor: соберём уникальных создателей из задач
    const map = new Map<number, PeerInfo>();
    (tasks as Task[]).forEach((task) => {
      if (!task.creator) return;
      if (!map.has(task.creator)) {
        map.set(task.creator, {
          id: task.creator,
          name: task.creator_name || `Создатель #${String(task.creator)}`,
          sub: task.creator_company || task.creator_position || null,
        });
      }
    });
    return Array.from(map.values());
  }, [role, executors, tasks]);

  const isPeersLoading = role === "creator" ? isExecutorsLoading : isTasksLoading;
  const isPeersError = role === "creator" ? isExecutorsError : isTasksError;

  useEffect(() => {
    if (!peers.length) return;
    setPeerId((prev) => (prev === null ? peers[0].id : prev));
  }, [peers]);

  // Открытие из задач (custom event)
  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<OpenChatFromTaskDetail>;
      const detail = custom.detail;
      if (!detail?.peerId) return;

      setIsOpen(true);
      setPeerId(detail.peerId);
      setTaskContextId(detail.taskId ?? null);
      setTaskContextTitle(detail.taskTitle ?? null);

      if (detail.taskTitle && !text) setText(detail.taskTitle + ": ");
    };

    window.addEventListener("open-chat-from-task", handler as EventListener);
    return () => window.removeEventListener("open-chat-from-task", handler as EventListener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const {
    data: messages = [],
    isLoading: isChatLoading,
    isError: isChatError,
    sendMessage,
    isSending,
  } = useTaskChat({
    peerId,
    enabled: isOpen && !!peerId,
    taskId: taskContextId ?? undefined,
  });

  const sortedMessages = useMemo(() => {
    return [...messages].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
  }, [messages]);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sortedMessages.length, isOpen]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !peerId) return;
    sendMessage(trimmed);
    setText("");
  };

  const currentPeer = peers.find((p) => p.id === peerId) ?? null;

  const handleOpenTaskFromContext = () => {
    if (!taskContextId) return;
    window.open(`/app/tasks/${taskContextId}`, "_blank");
  };

  const renderMessages = () => {
    if (!peerId) {
      if (isPeersLoading) return <div className={styles.info}>Загружаем список…</div>;
      if (isPeersError) return <div className={`${styles.info} ${styles.infoError}`}>Не удалось загрузить список.</div>;
      if (!peers.length) return <div className={styles.info}>Нет собеседников для чата.</div>;
      return <div className={styles.info}>Выберите собеседника слева.</div>;
    }

    if (isChatLoading) return <div className={styles.info}>Загружаем сообщения…</div>;
    if (isChatError) return <div className={`${styles.info} ${styles.infoError}`}>Не удалось загрузить сообщения.</div>;
    if (!sortedMessages.length) return <div className={styles.info}>Сообщений пока нет — напишите первое ✍️</div>;

    return (
      <>
        {sortedMessages.map((msg) => (
          <ChatMessageBubble key={msg.id} msg={msg} />
        ))}
      </>
    );
  };

  return (
    <>
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setIsOpen((p) => !p)}
        aria-label="Открыть чат"
      >
        💬
      </button>

      {isOpen && <div className={styles.backdrop} onClick={() => setIsOpen(false)} />}

      <aside className={`${styles.panel} ${isOpen ? styles.panelOpen : ""}`} aria-hidden={!isOpen}>
        <div className={styles.header}>
          <span className={styles.title}>
            {role === "creator" ? "Чат с исполнителями" : "Чат с постановщиками"}
          </span>
          <button type="button" className={styles.close} onClick={() => setIsOpen(false)} aria-label="Закрыть">
            ×
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.layout}>
            <div className={styles.peers}>
              {isPeersLoading && <div className={styles.info}>Загружаем список…</div>}
              {isPeersError && <div className={`${styles.info} ${styles.infoError}`}>Не удалось загрузить список.</div>}

              {!isPeersLoading && !isPeersError && peers.length > 0 && (
                <ul className={styles.list}>
                  {peers.map((p) => {
                    const isActive = peerId === p.id;
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          className={`${styles.listItem} ${isActive ? styles.listItemActive : ""}`}
                          onClick={() => {
                            setPeerId(p.id);
                            setTaskContextId(null);
                            setTaskContextTitle(null);
                          }}
                        >
                          <div className={styles.avatar}>{p.name[0]?.toUpperCase() ?? "?"}</div>
                          <div className={styles.listText}>
                            <div className={styles.listName}>{p.name}</div>
                            {p.sub && <div className={styles.listSub}>{p.sub}</div>}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {!isPeersLoading && !isPeersError && !peers.length && (
                <div className={styles.info}>Нет пользователей для чата.</div>
              )}
            </div>

            <div className={styles.conversation}>
              {currentPeer && (
                <div className={styles.meta}>
                  Собеседник: <strong>{currentPeer.name}</strong>
                </div>
              )}

              {taskContextTitle && (
                <div className={styles.meta}>
                  Задача:
                  <button type="button" onClick={handleOpenTaskFromContext}>
                    {taskContextTitle}
                  </button>
                </div>
              )}

              <div className={styles.messages}>
                {renderMessages()}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={handleSubmit} className={styles.inputRow}>
                <Input placeholder="Напишите сообщение…" value={text} onChange={(e) => setText(e.target.value)} />
                <Button type="submit" loading={isSending}>
                  →
                </Button>
              </form>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

const ChatMessageBubble = ({ msg }: { msg: ChatMessage }) => {
  const { auth } = useAuth();
  const myRole = normalizeRole(auth.user?.role ?? null);

  const isMine =
    (myRole === "creator" && msg.is_from_creator) ||
    (myRole === "executor" && msg.is_from_executor);

  const raw = msg as any;
  const taskId = raw.task_id ?? raw.task ?? null;

  const handleOpenTask = () => {
    if (!taskId) return;
    window.open(`/app/tasks/${taskId}`, "_blank");
  };

  return (
    <div className={`${styles.row} ${isMine ? styles.rowMine : styles.rowOther}`}>
      <div className={`${styles.bubble} ${isMine ? styles.bubbleMine : ""}`}>
        <div className={styles.bubbleHeader}>
          <span className={styles.sender}>{msg.sender_name}</span>
          <span className={styles.time}>
            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

        {msg.task_title && (
          <button type="button" className={styles.taskLink} onClick={handleOpenTask}>
            {msg.task_title}
          </button>
        )}

        {msg.text && <div className={styles.text}>{msg.text}</div>}

        {msg.file_url && (
          <div className={styles.attachment}>
            <a href={msg.file_url} target="_blank" rel="noopener noreferrer">
              Вложение
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
