"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";

export default function RegisterPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirmation) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data } = await api.post("/auth/register", {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      if (data.success) {
        login(data.data.token, data.data.user);
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Đăng ký thất bại. Vui lòng kiểm tra lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold tracking-tight">Tạo tài khoản</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Gia nhập EduQuiz ngay hôm nay
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 mt-8">
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Họ và tên</label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nguyễn Văn A"
              required
              className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nhapemail@example.com"
              required
              className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mật khẩu</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Xác nhận mật khẩu</label>
            <Input
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            />
          </div>
        </div>

        <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
          {loading ? "Đang xử lý..." : "Đăng ký"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-8">
        Đã có tài khoản?{" "}
        <Link href="/login" className="font-semibold text-primary hover:text-primary/80">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
