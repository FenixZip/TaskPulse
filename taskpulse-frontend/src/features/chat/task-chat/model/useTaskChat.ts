// src/features/chat/task-chat/model/useTaskChat.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../../shared/lib/apiClient";

export interface ChatMessage {
  id: number;
  task: number | null;
  task_title: string | null;
  sender: number;
  sender_name: string;
  is_from_creator: boolean;
  is_from_executor: boolean;
  text: string;
  created_at: string;
  file_url: string | null;
}

interface UseTaskChatParams {
  peerId: number | null;
  taskId?: number | null;
  enabled?: boolean;
}

export const useTaskChat = ({
  peerId,
  taskId,
  enabled = true,
}: UseTaskChatParams) => {
  const queryClient = useQueryClient();

  const messagesQuery = useQuery<ChatMessage[]>({
    queryKey: ["conversation", peerId, taskId],
    queryFn: async () => {
      const { data } = await apiClient.get<ChatMessage[]>(
        "/api/tasks/conversation-messages/",
        {
          params: { user_id: peerId },
        }
      );
      return data;
    },
    enabled: enabled && !!peerId,
    refetchInterval: enabled && !!peerId ? 5000 : false,
  });

  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!peerId) {
        throw new Error("peerId is required to send message");
      }

      const body: Record<string, any> = {
        user_id: Number(peerId),
        text,
      };

      if (taskId) {
        body.task = Number(taskId);
      }

      const { data } = await apiClient.post<ChatMessage>(
        "/api/tasks/conversation-messages/",
        body
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["conversation", peerId, taskId],
      });
    },
  });

  return {
    ...messagesQuery,
    sendMessage: (text: string) => sendMutation.mutate(text),
    isSending: sendMutation.isPending,
  };
};
