import React from "react";
import Link from "next/link";
import { Sparkles, CheckCircle2 } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground">
      {/* Cột trái: Hình ảnh/Branding */}
      <div className="relative hidden md:flex w-1/2 flex-col items-center justify-center bg-secondary/50 p-12 border-r border-border/80">
        
        {/* Floating Quiz Cards Illustration */}
        <div className="relative w-full max-w-md h-64 mb-10 flex items-center justify-center">
          {/* Card 1 */}
          <div className="absolute z-10 w-72 h-36 bg-card border border-border/80 rounded-2xl p-5 shadow-sm -rotate-2">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accent text-accent-foreground">
                Kinh tế vi mô
              </span>
              <span className="text-xs text-muted-foreground">40 câu hỏi</span>
            </div>
            <div className="w-full h-2.5 bg-muted rounded-full mb-2"></div>
            <div className="w-4/5 h-2.5 bg-muted rounded-full mb-4"></div>
            <div className="flex items-center gap-2 mt-auto">
              <div className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold">A</div>
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground font-medium">B</div>
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground font-medium">C</div>
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground font-medium">D</div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="absolute z-20 w-80 h-40 bg-card border border-primary/30 rounded-2xl p-5 shadow-md translate-x-8 translate-y-6 rotate-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                Chính xác!
              </span>
              <span className="text-xs font-medium text-primary">Điểm: 10/10</span>
            </div>
            <div className="text-sm font-semibold text-foreground line-clamp-1 mb-2">
              Khái niệm về độ co giãn của cầu theo giá là...
            </div>
            <div className="w-full bg-muted rounded-full h-2 mb-4 overflow-hidden">
              <div className="bg-primary h-2 rounded-full w-full transition-all"></div>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Thời gian làm bài: 15:30</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">+100 XP</span>
            </div>
          </div>
        </div>
        
        {/* Typography */}
        <div className="relative z-10 text-center max-w-md">
          <Link href="/" className="inline-flex items-center justify-center gap-2.5 mb-5 group">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <span className="text-2xl font-black text-primary-foreground tracking-tighter">OQ</span>
            </div>
            <span className="text-3xl font-bold tracking-tight text-foreground">
              Open<span className="text-primary">Quiz</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold mb-3 tracking-tight text-foreground">
            Luyện thi thông minh & Cá nhân hóa
          </h1>
          <p className="text-sm text-muted-foreground font-normal leading-relaxed">
            Nền tảng ôn luyện trắc nghiệm mở, tra cứu lịch thi tự động và kho câu hỏi chuẩn xác dành cho sinh viên.
          </p>
        </div>
      </div>

      {/* Cột phải: Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-background relative">
        {children}
      </div>
    </div>
  );
}
