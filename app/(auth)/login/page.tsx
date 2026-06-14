"use client";

import { FormEvent, useState } from "react";
import { useLogin } from "@/hooks/use-login";
import { useRouter } from "next/navigation";
import PublicRoute from "@/components/publicRoute";

export default function LoginPage() {
  const router = useRouter();
  const { mutate, isPending, error } = useLogin();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    mutate(form, {
      onSuccess: () => {
        router.push("/");
      },
    });
  };

  return (
    // <PublicRoute>
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
        <h2 className="text-2xl font-bold">Login</h2>

        <input
          type="email"
          placeholder="Email"
          className="w-full border p-2"
          value={form.email}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border p-2"
          value={form.password}
          onChange={(e) =>
            setForm({ ...form, password: e.target.value })
          }
        />

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-primary text-white p-2"
        >
          {isPending ? "Logging in..." : "Login"}
        </button>

        {error && (
          <p className="text-red-500">Login failed</p>
        )}
      </form>
    </div>
    // </PublicRoute>
  );
}