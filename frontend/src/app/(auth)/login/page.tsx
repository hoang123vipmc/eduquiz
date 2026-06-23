"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data } = await api.post("/auth/login", { email, password });
      if (data.success) {
        login(data.data.token, data.data.user);
        router.push("/dashboard");
      }
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const firstErrorKey = Object.keys(err.response.data.errors)[0];
        setError(err.response.data.errors[firstErrorKey][0]);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(`Lỗi kết nối: ${err.message}. Vui lòng kiểm tra lại cấu hình API.`);
      } else {
        setError("Đăng nhập thất bại. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/auth/redirect/google`;
  };

  return (
    <div className="w-full max-w-[420px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 z-10">
      <div className="text-center md:text-left">
        <h2 className="text-3xl font-bold tracking-tight text-white">Welcome back</h2>
        <p className="text-sm text-slate-400 mt-2 font-normal">
          Please enter your details to sign in.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 mt-8">
        {error && (
          <div className="p-3 text-sm text-red-400 bg-red-500/10 rounded-xl border border-red-500/20">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="h-12 bg-[#0f172a] border-white/5 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="h-12 bg-[#0f172a] border-white/5 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl transition-all"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input type="checkbox" id="remember" className="h-4 w-4 rounded bg-[#0f172a] border-white/10 text-blue-600 focus:ring-blue-500 focus:ring-offset-[#020617]" />
            <label htmlFor="remember" className="ml-2 block text-sm text-slate-400">
              Remember me
            </label>
          </div>
          <div className="text-sm">
            <a href="#" className="font-medium text-blue-500 hover:text-blue-400 transition-colors">
              Forgot password?
            </a>
          </div>
        </div>

        <Button type="submit" className="w-full h-12 text-base font-semibold bg-[#4F7CFF] hover:bg-[#6D91FF] text-white rounded-xl shadow-[0_4px_12px_rgba(79,124,255,0.2)] transition-all" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5"></div>
          </div>
          <div className="relative flex justify-center text-xs font-medium text-slate-500">
            <span className="px-2 bg-[#020617]">OR CONTINUE WITH</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full h-12 flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-slate-900 border-transparent rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
          onClick={loginWithGoogle}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span className="font-semibold">Google</span>
        </Button>
      </form>

      <p className="text-center text-sm text-slate-400 mt-8">
        Don't have an account?{" "}
        <Link href="/register" className="font-semibold text-blue-500 hover:text-blue-400 transition-colors">
          Sign up
        </Link>
      </p>
    </div>
  );
}
