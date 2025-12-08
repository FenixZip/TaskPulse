// src/features/auth/accept-invite/model/useAcceptInvite.ts
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "../../../../shared/lib/apiClient";

export interface AcceptInvitePayload {
  token: string;
  password: string;
  full_name?: string;
  position: string;
}

export interface AcceptInviteResponse {
  token: string;
  email: string;
}

export const useAcceptInvite = () =>
  useMutation<AcceptInviteResponse, any, AcceptInvitePayload>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<AcceptInviteResponse>(
        "/api/auth/accept-invite/",
        payload
      );
      return data;
    },
  });
