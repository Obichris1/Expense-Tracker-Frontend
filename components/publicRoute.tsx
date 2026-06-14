"use client";

import { useMe } from "@/hooks/use-me";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useMe();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/");
    }
  }, [isLoading, user, router]); // ✅ Added router to dependencies

  // ✅ Show loading while checking auth OR while authenticated (prevents flash)
  if (isLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default PublicRoute;