// src/features/auth/login/model/useLogin.ts
import { useMutation } from "@tanstack/react-query";
import { loginRequest } from "../../model/authApi";
import type { LoginPayload } from "../../model/authApi";

export const useLogin = () => {
  return useMutation({
    mutationFn: (payload: LoginPayload) => loginRequest(payload),
  });
};
