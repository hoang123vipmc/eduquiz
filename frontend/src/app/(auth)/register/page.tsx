"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import { GraduationCap, Info } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [studentId, setStudentId] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
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
        student_id: studentId.trim() || null,
      });
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
        setError("Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 px-2 sm:px-0">
      <div className="text-center">
        {/* Mobile Brand Logo */}
        <div className="md:hidden flex items-center justify-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/25">
            OQ
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-foreground">Open<span className="text-primary">Quiz</span></span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Tạo tài khoản</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Gia nhập OpenQuiz ngay hôm nay
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 mt-6 sm:mt-8">
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
              placeholder="Ít nhất 8 ký tự"
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
              placeholder="Nhập lại mật khẩu"
              required
              minLength={8}
              className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            />
          </div>

          {/* Optional Student ID field */}
          <div className="rounded-xl border border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-900/10 p-3.5 space-y-2.5">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <label className="block text-sm font-medium text-blue-900 dark:text-blue-200">
                Mã sinh viên HUBT <span className="text-xs font-normal text-blue-500 dark:text-blue-400">(Không bắt buộc)</span>
              </label>
            </div>
            <Input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="Ví dụ: 2823231208"
              maxLength={20}
              className="h-10 bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-800/50 focus-visible:ring-blue-500"
            />
            <p className="flex items-start gap-1.5 text-xs text-blue-600/80 dark:text-blue-400/80">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              Nhập MSV để website tự động tra cứu lịch thi và ưu tiên đề xuất các bộ đề ôn tập phù hợp với các môn thi sắp tới của bạn.
            </p>
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
