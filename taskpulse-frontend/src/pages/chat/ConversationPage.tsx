// src/pages/chat/ConversationPage.tsx
import {
  useState,
  type FormEvent,
  useMemo,
  useRef,
  useEffect,
} from "react";
import { useLocation, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../shared/lib/apiClient";
import { Button } from "../../shared/ui/Button";
import { Input } from "../../shared/ui/Input";
import { useAuth } from "../../shared/hooks/useAuth";

interface ChatMessage {
  id: number;
  task: number | null;
  task_title: string | null;
  sender: number;
  sender_name: string;
  is_from_creator: boolean;
  is_from_executor: boolean;
  text: string;
  file_url?: string | null;
  created_at: string;
}

// единый диалог между текущим пользователем и peerId
const fetchMessages = async (peerId: string): Promise<ChatMessage[]> => {
  const response = await apiClient.get("/api/tasks/conversation-messages/", {
    params: { user_id: peerId },
  });
  return response.data as ChatMessage[];
};

const sendMessage = async (params: {
  peerId: string;
  taskId?: string | null;
  text: string;
  file?: File | null;
}): Promise<ChatMessage> => {
  const { peerId, taskId, text, file } = params;

  const body = new FormData();
  body.append("user_id", peerId);
  if (taskId) {
    body.append("task", taskId);
  }
  if (text) {
    body.append("text", text);
  }
  if (file) {
    body.append("file", file);
  }

  const response = await apiClient.post(
    "/api/tasks/conversation-messages/",
    body
  );
  return response.data as ChatMessage;
};

export const ConversationPage = () => {
  const { userId: peerId } = useParams<{ userId: string }>();
  const location = useLocation();
  const { auth } = useAuth();
  const queryClient = useQueryClient();

  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );

  const peerName = searchParams.get("name") || "Собеседник";
  const taskTitle = searchParams.get("taskTitle") || "Задача";
  const taskId = searchParams.get("taskId");

  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const {
    data: messages = [],
    isLoading,
    isError,
  } = useQuery<ChatMessage[]>({
    queryKey: ["conversation", peerId],
    queryFn: () => fetchMessages(peerId as string),
    enabled: !!peerId,
    // простой поллинг, чтобы чат обновлялся
    refetchInterval: 5000,
  });

  const myRole = auth.user?.role ?? null;

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
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sortedMessages.length]);

  const sendMutation = useMutation({
    mutationFn: (params: { text: string; file: File | null }) =>
      sendMessage({
        peerId: peerId as string,
        taskId,
        text: params.text,
        file: params.file,
      }),
    onSuccess: () => {
      setText("");
      setFile(null);
      queryClient.invalidateQueries({
        queryKey: ["conversation", peerId],
      });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!peerId) return;

    const trimmed = text.trim();
    if (!trimmed && !file) return;

    sendMutation.mutate({ text: trimmed, file });
  };

  const isMine = (msg: ChatMessage) => {
    if (!myRole) return false;
    return (
      (myRole === "creator" && msg.is_from_creator) ||
      (myRole === "executor" && msg.is_from_executor)
    );
  };

  const renderBody = () => {
    if (isLoading) {
      return <p>Загружаем сообщения…</p>;
    }

    if (isError) {
      return <p>Не удалось загрузить сообщения. Попробуйте позже.</p>;
    }

    if (!sortedMessages.length) {
      return <p>Сообщений пока нет. Напишите первое сообщение.</p>;
    }

    return (
      <>
        {sortedMessages.map((msg) => {
          const mine = isMine(msg);

          return (
            <div
              key={msg.id}
              className={`chat-message-row ${mine ? "me" : "other"}`}
            >
              <div className={`chat-bubble ${mine ? "me" : "other"}`}>
                <div className="chat-bubble-header">
                  <span>{mine ? "Вы" : msg.sender_name}</span>
                  <span>
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="chat-bubble-task">
                  {msg.task_title || taskTitle}
                </div>
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
        })}
      </>
    );
  };

  return (
    <div className="dashboard-page">
      <h1 className="dashboard-header-title">Чат с {peerName}</h1>
      <p className="dashboard-header-subtitle">
        Обсуждение задачи: <strong>{taskTitle}</strong>
      </p>

      <div className="chat-shell">
        <div className="chat-messages-box">
          {renderBody()}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSubmit} className="chat-input-row">
          <Input
            placeholder="Напишите сообщение…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <Button type="submit" loading={sendMutation.isPending}>
            Отправить
          </Button>
        </form>
      </div>
    </div>
  );
};
