// src/features/profile/model/useChangePassword.ts
import { useMutation } from "@tanstack/react-query";
import { changePassword } from "../../../entities/user/model/profileApi";

export const useChangePassword = () => {
  return useMutation({
    mutationFn: changePassword,
  });
};
