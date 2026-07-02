import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login } from "@/services/auth";

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: login,

    onSuccess: (data) => {
      queryClient.setQueryData(["user"], data.data); // adjust if needed
    },
  });
};