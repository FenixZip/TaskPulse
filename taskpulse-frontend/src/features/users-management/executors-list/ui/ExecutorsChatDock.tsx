// src/features/users-management/executors-list/ui/ExecutorsChatDock.tsx
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useLocation } from "react-router-dom";

import { useAuth } from "../../../../shared/hooks/useAuth";
import { Input } from "../../../../shared/ui/Input";
import { Button } from "../../../../shared/ui/Button";
import {
  useTaskChat,
  type ChatMessage,
} from "../../../chat/task-chat/model/useTaskChat";
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

  // состояние дока / чата
  const [isOpen, setIsOpen] = useState(false);
  const [peerId, setPeerId] = useState<number | null>(null);
  const [text, setText] = useState("");

  // контекст задачи (когда чат открыт из карточки)
  const [taskContextId, setTaskContextId] = useState<number | null>(null);
  const [taskContextTitle, setTaskContextTitle] = useState<string | null>(null);

  // создатель – список исполнителей
  const {
    data: executors = [],
    isLoading: isExecutorsLoading,
    isError: isExecutorsError,
  } = useExecutors();

  // исполнитель – список задач (чтобы вытащить создателей)
  const {
    data: tasks = [],
    isLoading: isTasksLoading,
    isError: isTasksError,
  } = useTasks();

  // формируем список собеседников в зависимости от роли
  const peers: PeerInfo[] = useMemo(() => {
    if (role === "creator") {
      return (executors as Executor[]).map((ex) => ({
        id: ex.id,
        name: ex.full_name || ex.email || `Исполнитель #${ex.id}`,
        sub: ex.position || ex.company || null,
      }));
    }

    // executor: создатели задач
    const map = new Map<number, PeerInfo>();
    (tasks as Task[]).forEach((task) => {
      if (!task.creator) return;
      if (!map.has(task.creator)) {
        map.set(task.creator, {
          id: task.creator,
          name:
            task.creator_name ||
            `Создатель #${task.creator.toString()}`,
          sub: task.creator_company || task.creator_position || null,
        });
      }
    });
    return Array.from(map.values());
  }, [role, executors, tasks]);

  const isPeersLoading = role === "creator" ? isExecutorsLoading : isTasksLoading;
  const isPeersError = role === "creator" ? isExecutorsError : isTasksError;

  // выбираем первого собеседника по умолчанию
  useEffect(() => {
    if (!peers.length) return;
    setPeerId((prev) => (prev === null ? peers[0].id : prev));
  }, [peers]);

  // слушаем глобальное событие "open-chat-from-task" из TasksList
  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<OpenChatFromTaskDetail>;
      const detail = custom.detail;
      if (!detail || !detail.peerId) return;

      setIsOpen(true);
      setPeerId(detail.peerId);
      setTaskContextId(detail.taskId ?? null);
      setTaskContextTitle(detail.taskTitle ?? null);

      // если в инпуте ничего нет — подставляем название задачи
      if (detail.taskTitle && !text) {
        setText(detail.taskTitle + ": ");
      }
    };

    window.addEventListener("open-chat-from-task", handler as EventListener);
    return () => {
      window.removeEventListener(
        "open-chat-from-task",
        handler as EventListener,
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  // данные чата
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

  const sortedMessages = useMemo(
    () =>
      [...messages].sort(
        (a, b) =>
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime(),
      ),
    [messages],
  );

  const bottomRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
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
      if (isPeersLoading) return <p>Загружаем список…</p>;
      if (isPeersError) return <p>Не удалось загрузить список.</p>;
      if (!peers.length) return <p>Нет собеседников для чата.</p>;
      return <p>Выберите собеседника слева.</p>;
    }

    if (isChatLoading) return <p>Загружаем сообщения…</p>;
    if (isChatError) return <p>Не удалось загрузить сообщения.</p>;
    if (!sortedMessages.length) {
      return <p>Сообщений пока нет — напишите первое ✍️</p>;
    }

    return (
      <>
        {sortedMessages.map((msg) => (
          <ChatMessageBubble key={msg.id} msg={msg} />
        ))}
      </>
    );
  };

  // если не авторизованы или не в /app — ничего не рисуем
  if (!role || !location.pathname.startsWith("/app")) {
    return null;
  }

  return (
    <>
      {/* плавающая кнопка слева */}
      <button
        type="button"
        className="chat-dock-toggle"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Открыть чат"
      >
        💬
      </button>

      {isOpen && (
        <div
          className="chat-dock-backdrop"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={
          "chat-dock-panel" +
          (isOpen ? " chat-dock-panel--open" : "")
        }
        aria-hidden={!isOpen}
      >
        <div className="chat-dock-header">
          <span className="chat-dock-title">
            {role === "creator"
              ? "Чат с исполнителями"
              : "Чат с постановщиками"}
          </span>
          <button
            type="button"
            className="chat-dock-close"
            onClick={() => setIsOpen(false)}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        <div className="chat-dock-body">
          <div className="chat-dock-layout">
            {/* слева – список собеседников */}
            <div className="chat-dock-peers">
              {isPeersLoading && (
                <div className="chat-dock-info">
                  Загружаем список…
                </div>
              )}
              {isPeersError && (
                <div className="chat-dock-info chat-dock-info--error">
                  Не удалось загрузить список.
                </div>
              )}

              {!isPeersLoading && !isPeersError && !peers.length && (
                <div className="chat-dock-info">
                  Нет пользователей для чата.
                </div>
              )}

              {!isPeersLoading && !isPeersError && peers.length > 0 && (
                <ul className="chat-dock-list">
                  {peers.map((p) => {
                    const isActive = peerId === p.id;
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          className={
                            "chat-dock-list-item" +
                            (isActive
                              ? " chat-dock-list-item--active"
                              : "")
                          }
                          onClick={() => {
                            setPeerId(p.id);
                            setTaskContextId(null);
                            setTaskContextTitle(null);
                          }}
                        >
                          <div className="chat-dock-avatar">
                            {p.name[0]?.toUpperCase() ?? "?"}
                          </div>
                          <div className="chat-dock-list-text">
                            <div className="chat-dock-list-name">
                              {p.name}
                            </div>
                            {p.sub && (
                              <div className="chat-dock-list-sub">
                                {p.sub}
                              </div>
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* справа – диалог */}
            <div className="chat-dock-conversation">
              <div className="chat-dock-conversation-inner">
                {currentPeer && (
                  <div className="chat-current-peer">
                    Собеседник:{" "}
                    <strong>{currentPeer.name}</strong>
                  </div>
                )}

                {taskContextTitle && (
                  <div className="chat-current-task">
                    Задача:{" "}
                    <button
                      type="button"
                      onClick={handleOpenTaskFromContext}
                    >
                      {taskContextTitle}
                    </button>
                  </div>
                )}

                <div className="chat-messages-box">
                  {renderMessages()}
                  <div ref={bottomRef} />
                </div>
              </div>

              <form
                onSubmit={handleSubmit}
                className="chat-input-row"
              >
                <Input
                  placeholder="Напишите сообщение…"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
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

// пузырь сообщения
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
    <div
      className={
        "chat-message-row" +
        (isMine ? " me" : " other")
      }
    >
      <div
        className={
          "chat-bubble" + (isMine ? " me" : " other")
        }
      >
        <div className="chat-bubble-header">
          <span className="chat-bubble-sender">
            {msg.sender_name}
          </span>
          <span className="chat-bubble-time">
            {new Date(msg.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {msg.task_title && (
          <button
            type="button"
            className="chat-bubble-task-link"
            onClick={handleOpenTask}
          >
            {msg.task_title}
          </button>
        )}

        {msg.text && (
          <div className="chat-message-text">
            {msg.text}
          </div>
        )}

        {msg.file_url && (
          <div className="chat-message-attachment">
            <a
              href={msg.file_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Вложение
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
