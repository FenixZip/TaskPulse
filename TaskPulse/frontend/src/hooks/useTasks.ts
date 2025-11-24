// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { fetchTasks } from "../api/tasksApi";

export function useTasks(filters: Record<string, any> = {}) {
  return useQuery({
    queryKey: ["tasks", filters],
    queryFn: () => fetchTasks(filters),
  });
}
