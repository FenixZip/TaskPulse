// src/features/chat/task-chat/ui/TaskChat.tsx
import {
  useState,
  useEffect,
  useMemo,
  useRef,
  type FormEvent,
} from "react";

import { useAuth } from "../../../../shared/hooks/useAuth";
import { Button } from "../../../../shared/ui/Button";
import { Input } from "../../../../shared/ui/Input";
import { useTaskChat, type ChatMessage } from "../model/useTaskChat";
import { useExecutors } from "../../../users-management/executors-list/model/useExecutors";
import { useTasks } from "../../../tasks/list/model/useTasks";
import type { Task } from "../../../../entities/task/model/types";

type NormalizedRole = "creator" | "executor" | null;

const normalizeRole = (value: string | null | undefined): NormalizedRole => {
  if (!value) return null;
  if (value === "CREATOR" || value === "creator") return "creator";
  if (value === "EXECUTOR" || value === "executor") return "executor";
  return null;
};

export const TaskChat = () => {
  const { auth } = useAuth();
  const role = normalizeRole(auth.user?.role);

  // если роль не определена (теоретически не должно быть в /app), ничего не рисуем
  if (!role) return null;

  if (role === "creator") {
    return <CreatorChatWidget />;
  }

  return <ExecutorChatWidget />;
};

// ---------- Чат для СОЗДАТЕЛЯ (выбор исполнителя) ----------

const CreatorChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedExecutorId, setSelectedExecutorId] = useState<number | null>(
    null
  );
  const [text, setText] = useState("");

  const { data: executors = [], isLoading, isError } = useExecutors();

  // выбрать первого исполнителя по умолчанию
  useEffect(() => {
    if (!executors.length) return;
    if (selectedExecutorId === null) {
      setSelectedExecutorId(executors[0].id);
    }
  }, [executors, selectedExecutorId]);

  const peerId = selectedExecutorId;

  const {
    data: messages = [],
    isLoading: isChatLoading,
    isError: isChatError,
    sendMessage,
    isSending,
  } = useTaskChat({
    peerId,
    enabled: isOpen && !!peerId,
  });

  const sortedMessages = useMemo(
    () =>
      [...messages].sort(
        (a, b) =>
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
      ),
    [messages]
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

  const renderMessages = () => {
    if (!peerId) {
      if (isLoading) return <p>Загружаем исполнителей…</p>;
      if (isError) {
        return <p>Не удалось загрузить исполнителей.</p>;
      }
      if (!executors.length) {
        return (
          <p>
            Исполнителей пока нет. Сначала пригласите коллег, а потом сможете
            общаться с ними в чате.
          </p>
        );
      }
      return <p>Выберите исполнителя, чтобы начать переписку.</p>;
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

  const currentExecutor = executors.find((ex) => ex.id === selectedExecutorId);

  return (
    <>
      <button
        type="button"
        className="chat-widget-button"
        onClick={() => setIsOpen((v) => !v)}
      >
        💬
      </button>

      <div
        className={
          "chat-widget-panel" + (isOpen ? " chat-widget-panel--open" : "")
        }
      >
        <div className="chat-widget-header">
          <div>
            <div className="chat-widget-title">
              Чат с исполнителями
            </div>
            <div className="chat-widget-subtitle">
              Выберите исполнителя и обсудите задачи
            </div>
          </div>
          <button
            type="button"
            className="chat-widget-close"
            onClick={() => setIsOpen(false)}
          >
            ✕
          </button>
        </div>

        <div className="chat-widget-select">
          {isLoading && <p>Загружаем исполнителей…</p>}
          {isError && (
            <p>Не удалось загрузить исполнителей. Попробуйте позже.</p>
          )}

          {!!executors.length && (
            <select
              className="chat-select"
              value={selectedExecutorId ?? ""}
              onChange={(e) =>
                setSelectedExecutorId(
                  e.target.value ? Number(e.target.value) : null
                )
              }
            >
              {executors.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.full_name || ex.email || `Исполнитель #${ex.id}`}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="chat-messages-box">
          {currentExecutor && (
            <div className="chat-current-peer">
              Собеседник:{" "}
              <strong>
                {currentExecutor.full_name || currentExecutor.email}
              </strong>
            </div>
          )}

          {renderMessages()}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSubmit} className="chat-input-row">
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
    </>
  );
};

// ---------- Чат для ИСПОЛНИТЕЛЯ (выбор постановщика по задачам) ----------

const ExecutorChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCreatorId, setSelectedCreatorId] = useState<number | null>(
    null
  );
  const [text, setText] = useState("");

  const { data: tasks = [], isLoading, isError } = useTasks();

  // вытаскиваем уникальных постановщиков из задач
  const creators = useMemo(() => {
    const map = new Map<number, { id: number; name: string }>();
    (tasks as Task[]).forEach((task) => {
      if (!task.creator) return;
      if (!map.has(task.creator)) {
        map.set(task.creator, {
          id: task.creator,
          name: task.creator_name || `Создатель #${task.creator}`,
        });
      }
    });
    return Array.from(map.values());
  }, [tasks]);

  useEffect(() => {
    if (!creators.length) return;
    if (selectedCreatorId === null) {
      setSelectedCreatorId(creators[0].id);
    }
  }, [creators, selectedCreatorId]);

  const peerId = selectedCreatorId;

  const {
    data: messages = [],
    isLoading: isChatLoading,
    isError: isChatError,
    sendMessage,
    isSending,
  } = useTaskChat({
    peerId,
    enabled: isOpen && !!peerId,
  });

  const sortedMessages = useMemo(
    () =>
      [...messages].sort(
        (a, b) =>
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
      ),
    [messages]
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

  const renderMessages = () => {
    if (!peerId) {
      if (isLoading) return <p>Загружаем задачи…</p>;
      if (isError) {
        return <p>Не удалось загрузить задачи. Попробуйте позже.</p>;
      }
      if (!creators.length) {
        return (
          <p>
            Пока нет задач от создателей. Когда появятся задачи, вы сможете
            писать постановщику в чат.
          </p>
        );
      }
      return <p>Выберите постановщика, чтобы начать переписку.</p>;
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

  const currentCreator = creators.find(
    (c) => c.id === selectedCreatorId
  );

  return (
    <>
      <button
        type="button"
        className="chat-widget-button"
        onClick={() => setIsOpen((v) => !v)}
      >
        💬
      </button>

      <div
        className={
          "chat-widget-panel" + (isOpen ? " chat-widget-panel--open" : "")
        }
      >
        <div className="chat-widget-header">
          <div>
            <div className="chat-widget-title">Чат с создателем</div>
            <div className="chat-widget-subtitle">
              Обсуждайте задачи с постановщиком
            </div>
          </div>
          <button
            type="button"
            className="chat-widget-close"
            onClick={() => setIsOpen(false)}
          >
            ✕
          </button>
        </div>

        <div className="chat-widget-select">
          {isLoading && <p>Загружаем задачи…</p>}
          {isError && (
            <p>Не удалось загрузить задачи. Попробуйте позже.</p>
          )}

          {!!creators.length && (
            <select
              className="chat-select"
              value={selectedCreatorId ?? ""}
              onChange={(e) =>
                setSelectedCreatorId(
                  e.target.value ? Number(e.target.value) : null
                )
              }
            >
              {creators.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="chat-messages-box">
          {currentCreator && (
            <div className="chat-current-peer">
              Собеседник: <strong>{currentCreator.name}</strong>
            </div>
          )}

          {renderMessages()}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSubmit} className="chat-input-row">
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
    </>
  );
};

// ---------- Общий компонент пузыря сообщения ----------

const ChatMessageBubble = ({ msg }: { msg: ChatMessage }) => {
  const { auth } = useAuth();
  const myRole = auth.user?.role;

  const isMine =
    (myRole === "creator" && msg.is_from_creator) ||
    (myRole === "executor" && msg.is_from_executor);

  return (
    <div
      className={`chat-message-row ${isMine ? "me" : "other"}`}
    >
      <div className={`chat-bubble ${isMine ? "me" : "other"}`}>
        <div className="chat-bubble-header">
          <span>{isMine ? "Вы" : msg.sender_name}</span>
          <span>
            {new Date(msg.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {msg.task_title && (
          <div className="chat-bubble-task">
            {msg.task_title}
          </div>
        )}

        {msg.text && (
          <div className="chat-message-text">{msg.text}</div>
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
