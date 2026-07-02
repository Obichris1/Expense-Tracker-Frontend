import { useMutation } from "@tanstack/react-query";
import { register } from "@/services/auth";

export const useRegister = () => {
  return useMutation({
    mutationFn: register,
  });
};