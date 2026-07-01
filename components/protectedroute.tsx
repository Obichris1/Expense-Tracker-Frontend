import  {useMe} from "@/hooks/use-me"
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Loader from "./ui/loader";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading, isError } = useMe();
  const router = useRouter();

  console.log(user);
  

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [isLoading, user]);

  if (isLoading) return <Loader />;

  return <>{children}</>;
};

export default ProtectedRoute;