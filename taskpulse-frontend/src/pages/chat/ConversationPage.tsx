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
  task: number;
  task_title: string;
  sender: number;
  sender_name: string;
  is_from_creator: boolean;
  is_from_executor: boolean;
  text: string;
  created_at: string;
  file_url: string | null;
}

// единый диалог между текущим пользователем и peerId
const fetchMessages = async (peerId: string): Promise<ChatMessage[]> => {
  const response = await apiClient.get(
    "/api/tasks/conversation-messages/",
    {
      params: { user_id: peerId },
    }
  );
  return response.data as ChatMessage[];
};

const sendMessage = async (params: {
  peerId: string;
  taskId?: string | null;
  text: string;
}): Promise<ChatMessage> => {
  const body: Record<string, any> = {
    user_id: Number(params.peerId),
    text: params.text,
  };

  if (params.taskId) {
    body.task = Number(params.taskId);
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

  const searchParams = new URLSearchParams(location.search);
  const taskId = searchParams.get("taskId");
  const taskTitle = searchParams.get("taskTitle") || "Задача";
  const peerNameFromQuery = searchParams.get("name");

  const peerName =
    peerNameFromQuery ||
    (location.state as any)?.peerName ||
    "собеседником";

  const [text, setText] = useState("");
  const [pendingMessages, setPendingMessages] = useState<
    { id: string; text: string; created_at: string }[]
  >([]);

  const {
    data: messages = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["conversation", peerId],
    queryFn: () => fetchMessages(peerId as string),
    enabled: !!peerId,
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

  const sendMutation = useMutation({
    mutationFn: ({ text }: { text: string }) =>
      sendMessage({ peerId: peerId as string, taskId, text }),
    onSuccess: () => {
      setText("");
      setPendingMessages([]);
      // заглушаем Promise, чтобы TS не ругался
      void queryClient.invalidateQueries({
        queryKey: ["conversation", peerId],
      });
    },
    onError: () => {
      setPendingMessages([]);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !peerId) return;

    // оптимистично показываем сообщение
    setPendingMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        text: trimmed,
        created_at: new Date().toISOString(),
      },
    ]);

    sendMutation.mutate({ text: trimmed });
  };

  // автоскролл вниз
  const bottomRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sortedMessages.length, pendingMessages.length]);

  const renderBody = () => {
    if (isLoading) {
      return <p>Загружаем сообщения…</p>;
    }

    if (isError) {
      return <p>Не удалось загрузить сообщения. Попробуйте позже.</p>;
    }

    if (!sortedMessages.length && !pendingMessages.length) {
      return (
        <div className="text-sm text-[var(--text-secondary)]">
          Сообщений пока нет — самое время обсудить детали задачи 😊
        </div>
      );
    }

    return (
      <>
        {sortedMessages.map((msg) => {
          // роли в твоём проекте в нижнем регистре: "creator" | "executor"
          const isMine =
            myRole === "creator"
              ? msg.is_from_creator
              : myRole === "executor"
              ? msg.is_from_executor
              : false;

          return (
            <div
              key={msg.id}
              className={`mb-2 flex ${
                isMine ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                  isMine
                    ? "bg-[var(--accent)] text-black"
                    : "bg-black/50 text-[var(--text-primary)]"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] uppercase tracking-wide opacity-70">
                    {msg.sender_name}
                  </span>
                  <span className="text-[10px] opacity-60">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="text-[11px] opacity-80 mb-1">
                  {msg.task_title || taskTitle}
                </div>
                <div>{msg.text}</div>
              </div>
            </div>
          );
        })}

        {/* оптимистичные сообщения (мои) */}
        {pendingMessages.map((msg) => {
          const currentUserName =
            (auth.user as any)?.full_name ||
            (auth.user as any)?.fullName ||
            auth.user?.email ||
            "Вы";

          return (
            <div key={msg.id} className="mb-2 flex justify-end">
              <div className="max-w-[70%] rounded-2xl px-3 py-2 text-sm shadow-sm bg-[var(--accent)]/70 text-black opacity-80">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] uppercase tracking-wide opacity-70">
                    {currentUserName}
                  </span>
                  <span className="text-[10px] opacity-60">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="text-[11px] opacity-80 mb-1">
                  {taskTitle}
                </div>
                <div>{msg.text}</div>
              </div>
            </div>
          );
        })}
      </>
    );
  };

  return (
    <div className="page chat-page">
      <h1 className="page-title">Чат с {peerName}</h1>
      <p className="text-sm text-[var(--text-secondary)] mt-1">
        Обсуждение задачи: <strong>{taskTitle}</strong>
      </p>

      <div className="mt-6 flex flex-col gap-3 h-[60vh] max-h-[600px]">
        <div className="flex-1 overflow-y-auto rounded-2xl border border-[var(--border-subtle)] p-3 bg-black/25 text-sm">
          {renderBody()}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSubmit} className="flex gap-3">
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
