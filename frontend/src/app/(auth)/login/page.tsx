"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import { Sparkles, ArrowRight, GraduationCap } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect") || sessionStorage.getItem("auth_redirect");
      if (redirect) {
        setRedirectUrl(redirect);
        sessionStorage.setItem("auth_redirect", redirect);
      }
      const err = params.get("error");
      if (err) {
        if (err === "banned") {
          setError("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
        } else {
          setError("Lỗi đăng nhập Google: " + decodeURIComponent(err));
        }
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data } = await api.post("/auth/login", { email, password });
      if (data.success) {
        login(data.data.token, data.data.user);
        const target = redirectUrl || sessionStorage.getItem("auth_redirect") || "/dashboard";
        sessionStorage.removeItem("auth_redirect");
        router.push(target);
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
        setError("Đăng nhập thất bại. Vui lòng kiểm tra lại email hoặc mật khẩu.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      if (redirectUrl) {
        sessionStorage.setItem("auth_redirect", redirectUrl);
      }
      setLoading(true);
      const { data } = await api.get('/auth/redirect/google');
      if (data && data.url) {
        window.location.href = data.url;
        return;
      }
    } catch (e) {
      console.warn("Direct redirect fallback", e);
    }
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/auth/redirect/google`;
  };

  return (
    <div className="w-full max-w-[420px] space-y-6 sm:space-y-8 z-10 px-2 sm:px-0 animate-in fade-in duration-300">
      <div className="text-center md:text-left">
        {/* Mobile Brand Logo */}
        <div className="md:hidden flex items-center justify-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-xs">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-foreground">Open<span className="text-primary">Quiz</span></span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Chào mừng trở lại</h2>
        <p className="text-sm text-muted-foreground mt-2 font-normal leading-relaxed">
          Đăng nhập để tiếp tục ôn thi, luyện đề và tra cứu lịch thi cá nhân.
        </p>
      </div>

      {redirectUrl && (
        <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 flex items-start gap-3 text-left animate-in fade-in slide-in-from-top-2">
          <div className="p-2 rounded-xl bg-primary/15 text-primary shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs sm:text-sm font-bold text-foreground">Bạn nhận được lời mời làm bài thi!</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Vui lòng đăng nhập để hệ thống tự động đưa bạn vào phòng thi ngay.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {error && (
          <div className="p-3.5 text-xs sm:text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20 font-medium">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              className="h-11 bg-card border-border/80 text-foreground placeholder:text-muted-foreground rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-foreground">Mật khẩu</label>
              <Link href="#" className="text-xs text-primary hover:underline font-medium">
                Quên mật khẩu?
              </Link>
            </div>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="h-11 bg-card border-border/80 text-foreground placeholder:text-muted-foreground rounded-xl"
            />
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full h-11 text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-xs" 
          disabled={loading}
        >
          {loading ? "Đang xử lý..." : "Đăng nhập"}
        </Button>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/70"></div>
          </div>
          <div className="relative flex justify-center text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            <span className="px-3 bg-background">Hoặc tiếp tục với</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full h-11 flex items-center justify-center gap-2.5 rounded-xl border-border/80 bg-card hover:bg-secondary text-foreground font-semibold text-sm shadow-2xs"
          onClick={loginWithGoogle}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span>Đăng nhập với Google</span>
        </Button>

        <p className="text-center text-xs text-muted-foreground pt-1">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="font-bold text-primary hover:underline">
            Đăng ký ngay
          </Link>
        </p>
      </form>
    </div>
  );
}
