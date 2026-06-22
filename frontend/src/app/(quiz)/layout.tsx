"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (mounted && !isAuthenticated && !localStorage.getItem('auth_token')) {
      router.push("/login");
    }
  }, [isAuthenticated, router, mounted]);

  if (!mounted) return null;
  if (!isAuthenticated && !localStorage.getItem('auth_token')) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Không có sidebar/topbar chuẩn để focus vào việc làm bài */}
      {children}
    </div>
  );
}
