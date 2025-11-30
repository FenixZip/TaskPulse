// src/features/users-management/executors-list/model/useExecutors.ts
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../../shared/lib/apiClient";

export interface Executor {
  id: number;
  email: string;
  full_name: string | null;
  company: string | null;
  position: string | null;
}

const fetchExecutors = async (): Promise<Executor[]> => {
  const { data } = await apiClient.get<Executor[]>("/api/auth/executors/");
  return data;
};

export const useExecutors = () => {
  return useQuery<Executor[]>({
    queryKey: ["executors"],
    queryFn: fetchExecutors,
  });
};
