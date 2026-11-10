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
    <div className="w-full max-w-[400px] space-y-5 animate-in fade-in duration-200">
      <div>
        <Link href="/" className="md:hidden inline-flex items-center gap-2 mb-5">
          <div className="w-7 h-7 rounded-lg bg-foreground text-background flex items-center justify-center font-mono font-bold text-xs">
            OQ
          </div>
          <span className="font-semibold text-lg tracking-tight text-foreground">OpenQuiz</span>
        </Link>

        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Tạo tài khoản mới</h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Khởi tạo không gian ôn thi cá nhân trên OpenQuiz
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs text-destructive bg-destructive/10 rounded-lg border border-destructive/20 font-medium">
            {error}
          </div>
        )}
        
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1 text-foreground">Họ và tên</label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nguyễn Văn A"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-foreground">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nhapemail@example.com"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1 text-foreground">Mật khẩu</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 8 ký tự"
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-foreground">Xác nhận</label>
              <Input
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                required
                minLength={8}
              />
            </div>
          </div>

          {/* Optional Student ID */}
          <div className="rounded-lg border border-border bg-secondary/40 p-3.5 space-y-2">
            <div className="flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-primary shrink-0" />
              <label className="block text-xs font-semibold text-foreground">
                Mã sinh viên HUBT <span className="font-normal text-muted-foreground">(Tùy chọn)</span>
              </label>
            </div>
            <Input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="Ví dụ: 2823231208"
              maxLength={20}
              className="h-9 bg-card font-mono text-xs"
            />
            <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground leading-relaxed">
              <Info className="w-3 h-3 mt-0.5 shrink-0 text-primary" />
              <span>Tự động đồng bộ lịch thi học kỳ, bảng điểm và gợi ý đề ôn tập theo môn thi.</span>
            </p>
          </div>

          {/* Legal agreement checkbox */}
          <div className="flex items-start gap-2 pt-1">
            <input
              id="agree-terms"
              type="checkbox"
              checked={agreedTerms}
              onChange={(e) => setAgreedTerms(e.target.checked)}
              required
              className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer shrink-0"
            />
            <label htmlFor="agree-terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none">
              Tôi đồng ý với{" "}
              <Link href="/terms" target="_blank" className="text-primary font-medium hover:underline">
                Điều khoản sử dụng
              </Link>{" "}
              và{" "}
              <Link href="/privacy" target="_blank" className="text-primary font-medium hover:underline">
                Chính sách bảo mật
              </Link>{" "}
              của OpenQuiz.
            </label>
          </div>
        </div>

        <Button type="submit" className="w-full h-10 text-xs sm:text-sm font-semibold" disabled={loading || !agreedTerms}>
          {loading ? "Đang khởi tạo..." : "Đăng ký tài khoản"}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground pt-1">
        Đã có tài khoản?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
