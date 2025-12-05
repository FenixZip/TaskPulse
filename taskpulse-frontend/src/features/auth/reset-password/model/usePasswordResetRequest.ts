// src/features/auth/reset-password/model/usePasswordResetRequest.ts
import { useMutation } from "@tanstack/react-query";
import {
  passwordResetRequest,
  type PasswordResetRequestPayload,
  type PasswordResetRequestResponse,
} from "../../model/authApi";

export const usePasswordResetRequest = () => {
  return useMutation<PasswordResetRequestResponse, any, PasswordResetRequestPayload>({
    mutationFn: (payload) => passwordResetRequest(payload),
  });
};
