"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  BookOpen,
  FileText,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Bookmark,
  Award,
  BarChart3,
  Sun,
  Moon,
  Laptop,
  GraduationCap,
  ChevronRight,
  Upload,
  Layers,
  HelpCircle,
  FileCheck2,
  RefreshCcw,
  Volume2,
  Check,
  X
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Interactive Quiz Mini-Demo State in Hero
  const [demoTheme, setDemoTheme] = useState<"modern" | "itest">("modern");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const demoQuestion = {
    title: "Trong mô hình quan hệ đối tượng (OODB), quan hệ kế thừa (Inheritance) thường được biểu diễn thông qua mệnh đề nào?",
    diagramLabel: "Sơ đồ thực thể kế thừa: [Lớp Con] ──▷ [Lớp Cha]",
    options: [
      { id: 0, text: "Mệnh đề 'IMPLEMENTS' giữa hai giao diện độc lập", isCorrect: false },
      { id: 1, text: "Mệnh đề 'EXTENDS' hoặc quan hệ 'Is-a' giữa lớp con và lớp cha", isCorrect: true },
      { id: 2, text: "Mệnh đề 'HAS-A' thông qua con trỏ tham chiếu thành phần", isCorrect: false },
      { id: 3, text: "Cơ chế 'JOIN' trên khóa ngoại (Foreign Key) của bảng quan hệ", isCorrect: false }
    ],
    explanation: "Chính xác! Trong OODB, quan hệ kế thừa thể hiện bản chất 'Is-a' (Là-một). Lớp dẫn xuất kế thừa toàn bộ thuộc tính và phương thức từ lớp cơ sở."
  };

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
  };

  const resetDemo = () => {
    setSelectedOption(null);
    setIsAnswered(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-foreground">
      
      {/* ── 1. TOP NAVIGATION BAR ── */}
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Platform Pill */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-base shadow-sm group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-foreground">
                OpenQuiz
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Phi lợi nhuận
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">
              Tính năng
            </a>
            <a href="#itest-simulation" className="hover:text-foreground transition-colors">
              Mô phỏng iTest
            </a>
            <a href="#word-ingestion" className="hover:text-foreground transition-colors">
              Nhập đề Word
            </a>
            <a href="#error-notebook" className="hover:text-foreground transition-colors">
              Sổ tay câu khó
            </a>
            <a href="#comparison" className="hover:text-foreground transition-colors">
              Ưu điểm
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">
            {/* Theme Toggle */}
            {mounted && (
              <button
                type="button"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                aria-label="Chuyển đổi giao diện sáng/tối"
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                {resolvedTheme === "dark" ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-700" />
                )}
              </button>
            )}

            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs active:scale-95"
              >
                <span>Bảng điều khiển</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs active:scale-95"
                >
                  <span>Bắt đầu ôn thi</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── 2. HERO SECTION ── */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 border-b border-border/50 overflow-hidden">
        {/* Subtle Ambient Background Gradients (Not harsh neon blobs) */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(11,87,208,0.08),transparent)]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            
            {/* Announcement badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold shadow-2xs animate-in fade-in duration-300">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Nền tảng ôn thi trắc nghiệm đại học thế hệ mới</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
              Biến đề cương Word thành{" "}
              <span className="text-primary underline decoration-primary/30 decoration-wavy underline-offset-8">
                phòng thi trắc nghiệm
              </span>{" "}
              trong 3 giây.
            </h1>

            {/* Clear, honest description */}
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Hệ thống ôn luyện thông minh dành cho sinh viên. Tự động bóc tách sơ đồ &amp; hình ảnh từ file <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono text-foreground font-semibold">.docx</code>, mô phỏng phòng thi iTest chuẩn trường, và ghi nhớ câu sai bằng sổ tay thông minh.
            </p>

            {/* Hero CTA buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all shadow-sm active:scale-95"
              >
                <span>Bắt đầu ôn thi ngay</span>
                <span className="text-xs font-normal opacity-80">(Miễn phí 100%)</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </Link>
              <a
                href="#demo-interactive"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-sm font-semibold transition-colors shadow-2xs"
              >
                <Laptop className="w-4 h-4 text-primary" />
                <span>Trải nghiệm câu hỏi mẫu bên dưới</span>
              </a>
            </div>

            {/* Trust signals */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500" /> Không cần cài đặt phần mềm
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500" /> Tự động trích xuất ảnh sơ đồ
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500" /> Không quảng cáo gián đoạn
              </span>
            </div>
          </div>

          {/* ── HERO INTERACTIVE SHOWCASE: LIVE QUIZ CARD ── */}
          <div id="demo-interactive" className="mt-12 max-w-3xl mx-auto">
            <div className="rounded-2xl border border-border bg-card shadow-xl overflow-hidden transition-all duration-300">
              
              {/* Card Window Topbar */}
              <div className="px-4 sm:px-5 py-3 border-b border-border bg-muted/40 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground ml-2">
                    Luyện thi tương tác trực tiếp
                  </span>
                </div>

                {/* Theme Switcher in Demo: Modern vs iTest */}
                <div className="flex items-center gap-1 p-0.5 bg-muted rounded-lg border border-border/70 text-xs">
                  <button
                    type="button"
                    onClick={() => setDemoTheme("modern")}
                    className={cn(
                      "px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer",
                      demoTheme === "modern"
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Giao diện Hiện đại
                  </button>
                  <button
                    type="button"
                    onClick={() => setDemoTheme("itest")}
                    className={cn(
                      "px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer",
                      demoTheme === "itest"
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Phòng thi iTest
                  </button>
                </div>
              </div>

              {/* Card Body with chosen Theme styling */}
              <div
                className={cn(
                  "p-5 sm:p-7 transition-all duration-300",
                  demoTheme === "itest"
                    ? "bg-[#faf9f5] dark:bg-[#131720] font-serif text-[#1e293b] dark:text-[#f1f5f9]"
                    : "bg-card font-sans text-foreground"
                )}
              >
                {/* Meta Header */}
                <div className="flex items-center justify-between text-xs font-semibold mb-3 text-muted-foreground">
                  <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px] font-bold text-primary">
                    <FileText className="w-3.5 h-3.5" />
                    Đề cương: Lập trình &amp; CSDL • Câu 1 / 1
                  </span>
                  <span className="flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded bg-muted border border-border">
                    <Clock className="w-3 h-3 text-amber-500" /> 45:00
                  </span>
                </div>

                {/* Question Text */}
                <p className="text-base sm:text-lg font-bold leading-relaxed mb-3">
                  {demoQuestion.title}
                </p>

                {/* Simulated Diagram / Image Box */}
                <div className="mb-4 p-2.5 rounded-xl border border-dashed border-primary/30 bg-primary/5 flex items-center justify-center text-xs font-mono text-primary">
                  <span>📐 {demoQuestion.diagramLabel}</span>
                </div>

                {/* Options List */}
                <div className="space-y-2.5">
                  {demoQuestion.options.map((opt, idx) => {
                    const letter = String.fromCharCode(65 + idx);
                    const isSelected = selectedOption === idx;
                    const showResult = isAnswered;

                    let optionStyle = "border-border/80 bg-background hover:border-primary/50 hover:bg-muted/40 text-foreground";
                    if (showResult) {
                      if (opt.isCorrect) {
                        optionStyle = "border-emerald-500/60 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-semibold";
                      } else if (isSelected && !opt.isCorrect) {
                        optionStyle = "border-rose-500/60 bg-rose-500/10 text-rose-800 dark:text-rose-300 font-semibold";
                      } else {
                        optionStyle = "border-border/50 opacity-60 text-muted-foreground";
                      }
                    }

                    return (
                      <div
                        key={idx}
                        onClick={() => handleSelectOption(idx)}
                        className={cn(
                          "flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none",
                          optionStyle,
                          !isAnswered && "active:scale-[0.99]"
                        )}
                      >
                        <div
                          className={cn(
                            "w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                            showResult && opt.isCorrect
                              ? "bg-emerald-500 text-white"
                              : showResult && isSelected && !opt.isCorrect
                              ? "bg-rose-500 text-white"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {showResult && opt.isCorrect ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : showResult && isSelected && !opt.isCorrect ? (
                            <X className="w-3.5 h-3.5" />
                          ) : (
                            letter
                          )}
                        </div>
                        <div className="flex-1 text-xs sm:text-sm leading-relaxed pt-0.5">
                          {opt.text}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Card upon Answer */}
                {isAnswered && (
                  <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs sm:text-sm leading-relaxed text-emerald-900 dark:text-emerald-200 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="w-4 h-4" />
                        Giải thích chi tiết:
                      </span>
                      <button
                        type="button"
                        onClick={resetDemo}
                        className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCcw className="w-3 h-3" /> Thử lại câu hỏi
                      </button>
                    </div>
                    <p>{demoQuestion.explanation}</p>
                  </div>
                )}

                {/* Bottom Tip */}
                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="italic">
                    {!isAnswered ? "👉 Bấm chọn một phương án bất kỳ để xem phản hồi tức thì" : "✅ Hoàn thành câu hỏi thử nghiệm!"}
                  </span>
                  <Link
                    href="/dashboard/quizzes"
                    className="text-primary font-semibold hover:underline flex items-center gap-1"
                  >
                    Vào kho 500+ đề thi <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. FOUR CORE PILLARS (AUTHENTIC CRAFT, NO BENTO SLOP) ── */}
      <section id="features" className="py-16 md:py-24 border-b border-border/50 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Thiết kế chuyên biệt cho sinh viên
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight mt-2">
              4 Giá trị cốt lõi bạn không thể tìm thấy ở các web trắc nghiệm đại trà
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            
            {/* Pillar 1: Word Ingestion */}
            <div id="word-ingestion" className="p-6 sm:p-8 rounded-2xl border border-border bg-card shadow-xs space-y-4 hover:border-primary/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                Tự động bóc tách đề cương Word (.docx) &amp; Giữ nguyên hình ảnh
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Không cần nhập liệu thủ công từng câu. Chỉ cần tải lên file Word đề cương môn học, thuật toán tự động nhận diện mẫu câu tiếng Việt (<code className="text-xs bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">Câu 1:</code>, <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">*A. Đáp án</code>, <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">=&gt; Đáp án: C</code>) và <strong>tự động trích xuất các sơ đồ, hình vẽ kỹ thuật</strong> vào đúng câu hỏi.
              </p>
              <div className="pt-2 text-xs font-semibold text-primary flex items-center gap-1.5">
                <span>Hỗ trợ dán ảnh nhanh bằng Ctrl + V</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Pillar 2: iTest Simulator */}
            <div id="itest-simulation" className="p-6 sm:p-8 rounded-2xl border border-border bg-card shadow-xs space-y-4 hover:border-primary/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <Laptop className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                Chế độ mô phỏng phòng thi iTest chuẩn trường đại học
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Luyện tâm lý thi thật 100% với giao diện phòng máy iTest kinh điển: Bảng ma trận 40 câu hỏi, đồng hồ đếm ngược với số học tabular chống giật, lưu đáp án tự động khi mất kết nối và phát hiện rời tab thi để rèn luyện tính trung thực và kỷ luật.
              </p>
              <div className="pt-2 text-xs font-semibold text-primary flex items-center gap-1.5">
                <span>Chuyển đổi 1-click giữa Modern Theme &amp; iTest Theme</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Pillar 3: Error Notebook */}
            <div id="error-notebook" className="p-6 sm:p-8 rounded-2xl border border-border bg-card shadow-xs space-y-4 hover:border-primary/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Bookmark className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                Sổ tay câu hỏi khó &amp; Thuật toán luyện lại câu sai
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sai lầm lớn nhất khi ôn thi là làm lại các câu bản thân đã biết. OpenQuiz tự động gom các câu bạn trả lời sai hoặc đánh dấu bookmark vào <strong>Sổ tay câu khó riêng biệt</strong>, cho phép bạn ghi chú mẹo nhớ cá nhân và xuất bản in PDF trước giờ thi.
              </p>
              <div className="pt-2 text-xs font-semibold text-primary flex items-center gap-1.5">
                <span>Rút ngắn 50% thời gian ôn luyện trước ngày thi</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Pillar 4: Non-profit & Zero Ad */}
            <div className="p-6 sm:p-8 rounded-2xl border border-border bg-card shadow-xs space-y-4 hover:border-primary/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                100% Phi lợi nhuận, Không quảng cáo, Tôn trọng quyền riêng tư
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Xây dựng bởi tinh thần hỗ trợ cộng đồng sinh viên. Không bán khóa học, không giấu lời giải sau VIP paywall, không chèn banner quảng cáo cờ bạc gây sao nhãng việc học. Dữ liệu đề thi và quyền học tập thuộc về bạn.
              </p>
              <div className="pt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span>Mã nguồn minh bạch &amp; Miễn phí vĩnh viễn</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. HOW IT WORKS (3 SIMPLE STEPS) ── */}
      <section className="py-16 md:py-24 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Quy trình siêu tốc
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight mt-2">
              Từ file đề cương đến bài thi trong 3 bước đơn giản
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-card border border-border space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center shadow-xs">
                1
              </div>
              <h4 className="text-base font-bold text-foreground">
                Tải lên file Word (.docx) hoặc dán text
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Kéo thả file đề cương ôn tập có sẵn của bạn. Hệ thống hỗ trợ file lên tới 10MB và tự động bảo toàn hình ảnh sơ đồ.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-card border border-border space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center shadow-xs">
                2
              </div>
              <h4 className="text-base font-bold text-foreground">
                Xem trước &amp; Xác nhận bộ đề thi
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Kiểm tra trực quan các câu hỏi đã nhận diện, kiểm tra đáp án đúng và hình ảnh ở bảng Live Preview trước khi bấm tạo đề.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-card border border-border space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center shadow-xs">
                3
              </div>
              <h4 className="text-base font-bold text-foreground">
                Làm bài, chấm điểm &amp; Tự tin đạt điểm A
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Làm bài thi thử có bấm giờ, nhận phân tích chi tiết từng câu và lặp lại những câu sai cho đến khi thành thạo 100%.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. HONEST COMPARISON MATRIX ── */}
      <section id="comparison" className="py-16 md:py-24 border-b border-border/50 bg-muted/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              So sánh khách quan
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-2">
              Tại sao sinh viên chọn OpenQuiz thay vì tự đọc PDF hay web khác?
            </h2>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-xs">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/60 text-muted-foreground">
                  <th className="p-4 sm:p-5 font-bold uppercase tracking-wider text-xs w-[40%]">Tiêu chí</th>
                  <th className="p-4 sm:p-5 font-bold text-center text-xs w-[30%]">Đọc file Word / PDF thủ công</th>
                  <th className="p-4 sm:p-5 font-bold text-center text-xs text-primary bg-primary/5 w-[30%]">OpenQuiz</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-foreground">Tốc độ chuyển đổi thành bài thi</td>
                  <td className="p-4 sm:p-5 text-center text-muted-foreground">Mất hàng giờ tự tạo quiz</td>
                  <td className="p-4 sm:p-5 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-primary/5">3 giây (1-click upload)</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-foreground">Tự động bấm giờ &amp; Mô phỏng phòng thi iTest</td>
                  <td className="p-4 sm:p-5 text-center text-rose-500">❌ Không có</td>
                  <td className="p-4 sm:p-5 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-primary/5">✓ Chuẩn phòng thi thật</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-foreground">Tự động bóc tách ảnh sơ đồ, biểu đồ kỹ thuật</td>
                  <td className="p-4 sm:p-5 text-center text-rose-500">❌ Mất ảnh khi copy paste</td>
                  <td className="p-4 sm:p-5 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-primary/5">✓ Tự bóc tách + Phóng to</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-foreground">Lọc &amp; Gom riêng các câu làm sai để ôn lại</td>
                  <td className="p-4 sm:p-5 text-center text-rose-500">❌ Rất khó theo dõi</td>
                  <td className="p-4 sm:p-5 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-primary/5">✓ Sổ tay câu khó thông minh</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-foreground">Chi phí sử dụng</td>
                  <td className="p-4 sm:p-5 text-center text-muted-foreground">Miễn phí nhưng tốn công</td>
                  <td className="p-4 sm:p-5 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-primary/5">100% Phi lợi nhuận &amp; Mở</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── 6. POPULAR SUBJECT CATEGORIES ── */}
      <section className="py-14 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
            Đang được sinh viên ôn tập sôi nổi trên hệ thống
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
            {[
              "Triết học Mác - Lênin",
              "Cơ sở dữ liệu",
              "Lập trình Hướng đối tượng",
              "Mạng máy tính",
              "Pháp luật đại cương",
              "Kinh tế chính trị",
              "Toán rời rạc",
              "Hệ thống thông tin quản lý",
              "Kiến trúc máy tính"
            ].map((subject, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-semibold text-foreground hover:border-primary/40 transition-colors shadow-2xs"
              >
                📚 {subject}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. FINAL CALL TO ACTION ── */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-primary/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight">
            Sẵn sàng bứt phá điểm số trong kỳ thi sắp tới?
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
            Không cần thẻ tín dụng, không quảng cáo làm phiền. Tạo tài khoản trong 15 giây và bắt đầu làm bài thi đầu tiên của bạn.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all shadow-md active:scale-95"
            >
              <span>Đăng ký tài khoản miễn phí</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard/quizzes"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-sm font-semibold transition-colors shadow-2xs"
            >
              <BookOpen className="w-4 h-4 text-primary" />
              <span>Khám phá kho đề thi mẫu</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 8. FOOTER ── */}
      <footer className="mt-auto border-t border-border bg-card text-muted-foreground py-10 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
              <GraduationCap className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-foreground">OpenQuiz</span>
            <span>— Nền tảng ôn thi trắc nghiệm mở &amp; phi lợi nhuận.</span>
          </div>
          <div className="flex items-center gap-5 font-medium">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Chính sách bảo mật
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Điều khoản sử dụng
            </Link>
            <a
              href="https://github.com/hoang123vipmc/eduquiz"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub Repo
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
