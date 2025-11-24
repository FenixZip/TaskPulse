// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchConversationMessages,
  sendConversationMessage,
  TaskMessage,
} from "../api/chatApi";

/**
 * Хук для общего диалога между текущим пользователем и другим пользователем
 */
export function useConversationMessages(userId?: number) {
  const queryClient = useQueryClient();

  const messagesQuery = useQuery<TaskMessage[]>({
    queryKey: ["conversation", userId],
    queryFn: () => fetchConversationMessages(userId!),
    enabled: !!userId, // не запрашиваем, пока нет userId
  });

  const sendMutation = useMutation({
    mutationFn: (payload: {
      userId: number;
      taskId: number;
      text?: string;
      file?: File | null;
    }) => sendConversationMessage(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["conversation", variables.userId],
      });
    },
  });

  return {
    ...messagesQuery,
    sendMessage: sendMutation.mutateAsync,
    sending: sendMutation.isPending,
  };
}
