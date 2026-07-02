import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/services/auth";


export const useMe = () => {
 const query = useQuery({
    queryKey: ["user"],
    queryFn: getMe,
    retry: false,
    refetchOnWindowFocus: false, // 🚨 prevents random loops
    staleTime: 5 * 60 * 1000, 
  });

  return {
    user: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  };
};