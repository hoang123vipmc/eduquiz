"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import { Loader2, AlertCircle } from "lucide-react";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((state) => state.login);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      if (errorParam === "banned") {
        setError("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
      } else {
        setError("Đăng nhập bằng Google không thành công. Vui lòng thử lại.");
      }
      return;
    }

    if (!token) {
      setError("Không tìm thấy mã xác thực phiên đăng nhập.");
      return;
    }

    const completeGoogleLogin = async () => {
      try {
        localStorage.setItem("auth_token", token);
        const { data } = await api.get("/user");
        if (data.success && data.data) {
          login(token, data.data);
          router.replace("/dashboard");
        } else {
          setError("Không thể lấy thông tin tài khoản người dùng.");
        }
      } catch (err: any) {
        console.error("Lỗi xác thực người dùng Google:", err);
        setError("Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
      }
    };

    completeGoogleLogin();
  }, [searchParams, login, router]);

  if (error) {
    return (
      <div className="w-full max-w-[420px] p-6 bg-card border border-border rounded-2xl text-center space-y-4 shadow-xl">
        <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Đăng nhập thất bại</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{error}</p>
        <button
          onClick={() => router.replace("/login")}
          className="w-full py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all"
        >
          Quay lại trang Đăng nhập
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[420px] p-8 bg-card border border-border rounded-2xl text-center space-y-4 shadow-xl">
      <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
        <Loader2 className="w-7 h-7 animate-spin" />
      </div>
      <h2 className="text-xl font-bold text-foreground">Đang xác thực Google...</h2>
      <p className="text-sm text-muted-foreground">
        Vui lòng đợi trong giây lát, hệ thống đang đồng bộ phiên đăng nhập của bạn.
      </p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-[420px] p-8 bg-card border border-border rounded-2xl text-center space-y-4 shadow-xl">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
