// src/features/auth/register/model/useRegister.ts
import { useMutation } from "@tanstack/react-query";
import { registerRequest } from "../../model/authApi";
import type { RegisterPayload } from "../../../../entities/user/model/types";

export const useRegister = () => {
  return useMutation({
    mutationFn: (payload: RegisterPayload) => registerRequest(payload),
  });
};
