// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { fetchExecutors } from "../api/executorsApi";

export function useExecutors() {
  return useQuery({
    queryKey: ["executors"],
    queryFn: fetchExecutors,
  });
}
