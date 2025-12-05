// src/features/tasks/actions/model/useUpdateTaskStatus.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTaskStatus } from "../../../../entities/task/model/api";
import type { TaskStatus } from "../../../../entities/task/model/types";

export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { taskId: number; status: TaskStatus }) =>
      updateTaskStatus(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
};
