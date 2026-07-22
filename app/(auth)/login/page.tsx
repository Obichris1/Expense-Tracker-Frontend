"use client";

import { useState } from "react";
import { useLogin } from "@/hooks/use-login";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight,LogIn } from "lucide-react";
import { getErrorMessage } from "@/lib/errors";


export default function LoginPage() {
  const router = useRouter();
  const { mutate, isPending, error } = useLogin();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    mutate(form, {
      onSuccess: () => router.push("/"),
    });
  };

  return (
    <div className="flex min-h-screen !overflow-hidden">
      {/* Left Panel - Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src="/budget2.jpg" // replace with your image
          alt="Budget background"
          className="w-full h-screen"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Overlay text */}
        <div className="absolute inset-0 flex flex-col justify-end p-12">
          <h1 className="text-4xl font-bold text-white leading-snug mb-3">
            Take control of <br /> your finances.
          </h1>
          <p className="text-white/70 text-base max-w-sm">
            Track your income, expenses, and savings — all in one place.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-6 py-16">
        <div className="w-full max-w-sm space-y-8">
          {/* Logo/Brand */}
          <div>
          <div className="w-9 h-9 bg-black rounded-lg text-white flex items-center justify-center mb-6 ">
  <LogIn className="w-5 h-5" />
</div>
            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
            <p className="text-gray-500 text-sm mt-1">
              Don't have an account?{" "}
              <Link href="/register" className="text-black font-semibold underline underline-offset-2 hover:opacity-70 transition-opacity">
                Sign up
              </Link>
            </p>
          </div>

          {/* Error */}
          {error && (
  <div className="bg-gray-50 border border-gray-200 text-gray-700 text-sm px-4 py-3 rounded-lg">
    {getErrorMessage(error)}
  </div>
)}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <Link href="/forgot-password" className="text-xs text-gray-500 hover:text-black transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-sm mt-2"
            >
              {isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-gray-600">Terms</Link>
            {" "}and{" "}
            <Link href="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}