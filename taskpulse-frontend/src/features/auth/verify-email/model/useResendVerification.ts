// src/features/auth/verify-email/model/useResendVerification.ts
import { useMutation } from "@tanstack/react-query";
import {
  resendVerificationRequest,
  type ResendVerificationPayload,
  type ResendVerificationResponse,
} from "../../model/authApi";

export const useResendVerification = () => {
  return useMutation<ResendVerificationResponse, any, ResendVerificationPayload>({
    mutationFn: (payload) => resendVerificationRequest(payload),
  });
};
