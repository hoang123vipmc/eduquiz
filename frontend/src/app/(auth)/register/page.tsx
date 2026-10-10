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
  const [agreedTerms, setAgreedTerms] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!agreedTerms) {
      setError("Vui lòng đọc và tích chọn đồng ý với Điều khoản sử dụng và Chính sách bảo mật.");
      return;
    }
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
          const redirectTarget = typeof window !== 'undefined' ? (sessionStorage.getItem("auth_redirect") || "/dashboard") : "/dashboard";
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem("auth_redirect");
          }
          router.push(redirectTarget);
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
        <div className="md:hidden flex items-center justify-center gap-2.5 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center font-black text-primary-foreground shadow-sm">
            OQ
          </div>
          <span className="font-bold text-2xl tracking-tight text-foreground">Open<span className="text-primary">Quiz</span></span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Tạo tài khoản mới</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Bắt đầu ôn thi hiệu quả cùng cộng đồng sinh viên OpenQuiz
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 mt-6 sm:mt-8">
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20 font-medium">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">Họ và tên</label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nguyễn Văn A"
              required
              className="h-11"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nhapemail@example.com"
              required
              className="h-11"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">Mật khẩu</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 8 ký tự"
              required
              minLength={8}
              className="h-11"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">Xác nhận mật khẩu</label>
            <Input
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              required
              minLength={8}
              className="h-11"
            />
          </div>

          {/* Optional Student ID field */}
          <div className="rounded-2xl border border-border/80 bg-secondary/50 p-4 space-y-2.5">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary shrink-0" />
              <label className="block text-sm font-medium text-foreground">
                Mã sinh viên HUBT <span className="text-xs font-normal text-muted-foreground">(Không bắt buộc)</span>
              </label>
            </div>
            <Input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="Ví dụ: 2823231208"
              maxLength={20}
              className="h-10 bg-card"
            />
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
              Nhập MSV để OpenQuiz tự động tra cứu lịch thi và gợi ý đề ôn tập tương ứng cho bạn.
            </p>
          </div>

          {/* Legal agreement checkbox */}
          <div className="flex items-start gap-2.5 pt-1">
            <input
              id="agree-terms"
              type="checkbox"
              checked={agreedTerms}
              onChange={(e) => setAgreedTerms(e.target.checked)}
              required
              className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer shrink-0"
            />
            <label htmlFor="agree-terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none">
              Tôi xác nhận đã đọc, hiểu và đồng ý với{" "}
              <Link href="/terms" target="_blank" className="text-primary font-semibold hover:underline">
                Điều khoản sử dụng
              </Link>{" "}
              và{" "}
              <Link href="/privacy" target="_blank" className="text-primary font-semibold hover:underline">
                Chính sách bảo mật
              </Link>{" "}
              của OpenQuiz.
            </label>
          </div>
        </div>

        <Button type="submit" className="w-full h-11 text-base font-semibold rounded-xl" disabled={loading || !agreedTerms}>
          {loading ? "Đang xử lý..." : "Đăng ký tài khoản"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-8">
        Đã có tài khoản?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
