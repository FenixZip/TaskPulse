// src/features/tasks/list/model/useTasks.ts
import { useQuery } from "@tanstack/react-query";
import { getTasks } from "../../../../entities/task/model/api";

export const useTasks = () => {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: getTasks,
  });
};
