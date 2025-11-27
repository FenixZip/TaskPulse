// src/features/profile/model/useUpdateProfile.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfile } from "../../../entities/user/model/profileApi";

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};
