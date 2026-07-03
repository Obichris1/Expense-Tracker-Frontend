import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "@/services/auth";

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,

    onSuccess: (data) => {
      queryClient.setQueryData(["user"], data.data); // adjust if needed
    },
  });
};