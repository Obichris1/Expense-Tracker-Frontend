import  {useMe} from "@/hooks/use-me"
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading, isError } = useMe();
  const router = useRouter();

  console.log(user);
  

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [isLoading, user]);

  if (isLoading) return <p>Loading...</p>;

  return <>{children}</>;
};

export default ProtectedRoute;