"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  BookOpen,
  FileText,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sun,
  Moon,
  Laptop,
  ChevronRight,
  RefreshCcw,
  Check,
  X,
  Terminal
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore();
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [demoTheme, setDemoTheme] = useState<"modern" | "itest">("modern");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const demoQuestion = {
    title: "Trong mô hình quan hệ đối tượng (OODB), quan hệ kế thừa (Inheritance) thường được biểu diễn thông qua mệnh đề nào?",
    diagramLabel: "[SubClass: SinhVien] ──▷ [SuperClass: Nguoi]",
    options: [
      { id: 0, text: "Mệnh đề 'IMPLEMENTS' giữa hai giao diện độc lập", isCorrect: false },
      { id: 1, text: "Mệnh đề 'EXTENDS' hoặc quan hệ 'Is-a' giữa lớp con và lớp cha", isCorrect: true },
      { id: 2, text: "Mệnh đề 'HAS-A' thông qua con trỏ tham chiếu thành phần", isCorrect: false },
      { id: 3, text: "Cơ chế 'JOIN' trên khóa ngoại (Foreign Key) của bảng quan hệ", isCorrect: false }
    ],
    explanation: "Chính xác. Trong OODB, quan hệ kế thừa thể hiện bản chất 'Is-a' (Là-một). Lớp dẫn xuất kế thừa toàn bộ thuộc tính và phương thức từ lớp cơ sở."
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

  const capabilities = [
    {
      index: "01",
      id: "word-ingestion",
      code: "DOCX_PARSER",
      title: "Bóc tách đề cương Word (.docx) & Giữ nguyên sơ đồ kỹ thuật",
      description:
        "Tải lên trực tiếp file đề cương môn học. Bộ phân tích tự động nhận diện cấu trúc câu hỏi tiếng Việt (Câu 1:, *A., => Đáp án: C) và trích xuất toàn bộ hình vẽ, biểu đồ vào đúng vị trí câu hỏi.",
      spec: "Hỗ trợ dán ảnh trực tiếp Ctrl+V • Dung lượng tối đa 10MB/file"
    },
    {
      index: "02",
      id: "itest-simulation",
      code: "ITEST_RUNTIME",
      title: "Mô phỏng chuẩn xác giao diện phòng máy thi đại học (iTest)",
      description:
        "Rèn luyện phản xạ phòng thi thực tế với ma trận câu hỏi, đồng hồ đếm ngược tabular-nums chống lệch nhịp, lưu trạng thái bài làm tức thời khi gián đoạn mạng và phím tắt chọn nhanh A-B-C-D.",
      spec: "Chuyển đổi tức thì 1-click giữa OpenQuiz Modern và iTest Classic"
    },
    {
      index: "03",
      id: "error-notebook",
      code: "ERROR_LEDGER",
      title: "Sổ tay câu hỏi khó & Thuật toán cô lập câu trả lời sai",
      description:
        "Không lãng phí thời gian làm lại những câu đã thuộc. Hệ thống tự động gom các câu trả lời sai hoặc đánh dấu lưu ý vào sổ tay riêng biệt, tích hợp trợ lý AI giải thích bản chất và tạo từ khóa nhớ nhanh 3 giây.",
      spec: "Rút ngắn 50% thời gian ôn tập trước kỳ thi học kỳ"
    },
    {
      index: "04",
      id: "open-platform",
      code: "ZERO_PAYWALL",
      title: "Vận hành phi lợi nhuận, không quảng cáo, bảo mật dữ liệu",
      description:
        "Xây dựng độc lập phục vụ cộng đồng sinh viên. Không khóa lời giải sau gói VIP, không hiển thị banner quảng cáo gây xao nhãng, đồng bộ trực tiếp lịch thi và bảng điểm học phần cá nhân.",
      spec: "Miễn phí 100% • Mã nguồn minh bạch"
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      
      {/* ── 1. TOP NAVIGATION BAR ── */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          
          {/* Brand Identity */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-foreground text-background flex items-center justify-center font-mono font-bold text-xs tracking-tight">
              OQ
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-base tracking-tight text-foreground">
                OpenQuiz
              </span>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-secondary text-muted-foreground border border-border">
                v2.6 • Open Academic
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">
              Kiến trúc tính năng
            </a>
            <a href="#itest-simulation" className="hover:text-foreground transition-colors">
              Phòng thi iTest
            </a>
            <a href="#workflow" className="hover:text-foreground transition-colors">
              Quy trình
            </a>
            <a href="#comparison" className="hover:text-foreground transition-colors">
              So sánh
            </a>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            {mounted && (
              <button
                type="button"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                aria-label="Chuyển đổi giao diện sáng/tối"
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
              >
                {resolvedTheme === "dark" ? (
                  <Sun className="w-4 h-4 text-foreground" />
                ) : (
                  <Moon className="w-4 h-4 text-foreground" />
                )}
              </button>
            )}

            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
              >
                <span>Bảng điều khiển</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-foreground text-background hover:bg-foreground/90 text-xs font-medium transition-colors"
                >
                  <span>Bắt đầu ôn thi</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── 2. HERO SECTION (12-COLUMN ASYMMETRIC ARCHITECTURAL SPLIT) ── */}
      <section className="py-12 md:py-20 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            
            {/* Left Column: Editorial Headline + CTAs + Metrics */}
            <div className="lg:col-span-6 space-y-6 pt-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-secondary border border-border text-foreground text-xs font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>HỆ THỐNG LUYỆN THI ĐẠI HỌC • OPENQUIZ 2026</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground leading-[1.12]">
                Chuyển đổi đề cương Word thành phòng thi chuẩn xác trong 3 giây.
              </h1>

              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
                Không gian ôn luyện trắc nghiệm tối giản dành cho sinh viên. Tự động bóc tách sơ đồ từ file <code className="text-xs bg-secondary border border-border px-1.5 py-0.5 rounded font-mono text-foreground">.docx</code>, mô phỏng 100% phòng máy iTest, kết hợp trợ lý AI phân tích câu hỏi và sổ tay cô lập câu sai.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs sm:text-sm font-semibold hover:bg-primary/90 transition-colors shadow-2xs"
                >
                  <span>Tạo tài khoản miễn phí</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/dashboard/quizzes"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-border bg-card hover:bg-secondary text-foreground text-xs sm:text-sm font-medium transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                  <span>Duyệt kho 500+ đề thi</span>
                </Link>
              </div>

              {/* Architectural Metrics Strip */}
              <div className="pt-6 border-t border-border grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-foreground font-mono tabular-nums tracking-tight">
                    500+
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Bộ đề cương đại học
                  </div>
                </div>
                <div className="border-l border-border pl-4">
                  <div className="text-xl sm:text-2xl font-bold text-foreground font-mono tabular-nums tracking-tight">
                    &lt; 3.0s
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Tốc độ phân tích .docx
                  </div>
                </div>
                <div className="border-l border-border pl-4">
                  <div className="text-xl sm:text-2xl font-bold text-foreground font-mono tabular-nums tracking-tight">
                    0đ
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Chi phí &amp; Không quảng cáo
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Live Interactive Quiz Simulator */}
            <div id="demo-interactive" className="lg:col-span-6">
              <div className="rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                
                {/* Window Header */}
                <div className="px-4 py-2.5 border-b border-border bg-secondary/40 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-mono font-medium text-foreground">
                       interactive-exam-preview
                    </span>
                  </div>

                  {/* Theme Switcher */}
                  <div className="flex items-center gap-1 p-0.5 bg-secondary rounded-lg border border-border text-[11px]">
                    <button
                      type="button"
                      onClick={() => setDemoTheme("modern")}
                      className={cn(
                        "px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer",
                        demoTheme === "modern"
                          ? "bg-card text-foreground shadow-2xs border border-border"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Modern SaaS
                    </button>
                    <button
                      type="button"
                      onClick={() => setDemoTheme("itest")}
                      className={cn(
                        "px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer",
                        demoTheme === "itest"
                          ? "bg-card text-foreground shadow-2xs border border-border"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      iTest Phòng máy
                    </button>
                  </div>
                </div>

                {/* Simulator Body */}
                <div
                  className={cn(
                    "p-5 sm:p-6 transition-colors",
                    demoTheme === "itest"
                      ? "bg-[#faf9f5] dark:bg-[#14171f] font-serif text-[#18181b] dark:text-[#f4f4f5]"
                      : "bg-card font-sans text-foreground"
                  )}
                >
                  {/* Meta Header */}
                  <div className="flex items-center justify-between text-xs mb-3 pb-2.5 border-b border-border">
                    <span className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-primary">
                      <FileText className="w-3.5 h-3.5" />
                      <span>CSDL_OODB.DOCX • CÂU 01/40</span>
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded bg-secondary border border-border tabular-nums text-foreground">
                      <Clock className="w-3 h-3 text-muted-foreground" /> 44:59
                    </span>
                  </div>

                  {/* Question Stem */}
                  <p className="text-sm sm:text-base font-semibold leading-relaxed mb-3">
                    {demoQuestion.title}
                  </p>

                  {/* Extracted Diagram Preview */}
                  <div className="mb-4 px-3 py-2 rounded-lg border border-border bg-secondary/40 flex items-center justify-between text-xs font-mono text-foreground">
                    <span>{demoQuestion.diagramLabel}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">Sơ đồ trích xuất</span>
                  </div>

                  {/* Options List */}
                  <div className="space-y-2">
                    {demoQuestion.options.map((opt, idx) => {
                      const letter = String.fromCharCode(65 + idx);
                      const isSelected = selectedOption === idx;
                      const showResult = isAnswered;

                      let optionStyle = "border-border bg-background hover:border-foreground/30 hover:bg-secondary/40 text-foreground";
                      if (showResult) {
                        if (opt.isCorrect) {
                          optionStyle = "border-emerald-500/50 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-medium";
                        } else if (isSelected && !opt.isCorrect) {
                          optionStyle = "border-rose-500/50 bg-rose-500/10 text-rose-800 dark:text-rose-300 font-medium";
                        } else {
                          optionStyle = "border-border opacity-55 text-muted-foreground";
                        }
                      }

                      return (
                        <div
                          key={idx}
                          onClick={() => handleSelectOption(idx)}
                          className={cn(
                            "flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer select-none",
                            optionStyle
                          )}
                        >
                          <div
                            className={cn(
                              "w-5 h-5 rounded text-[11px] font-mono font-semibold flex items-center justify-center shrink-0 mt-0.5 border transition-colors",
                              showResult && opt.isCorrect
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : showResult && isSelected && !opt.isCorrect
                                ? "bg-rose-600 text-white border-rose-600"
                                : "bg-secondary text-foreground border-border"
                            )}
                          >
                            {showResult && opt.isCorrect ? (
                              <Check className="w-3 h-3" />
                            ) : showResult && isSelected && !opt.isCorrect ? (
                              <X className="w-3 h-3" />
                            ) : (
                              letter
                            )}
                          </div>
                          <div className="flex-1 text-xs sm:text-[13px] leading-relaxed">
                            {opt.text}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Instant Feedback Drawer */}
                  {isAnswered && (
                    <div className="mt-3.5 p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs leading-relaxed text-emerald-950 dark:text-emerald-200 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Giải thích đáp án</span>
                        </span>
                        <button
                          type="button"
                          onClick={resetDemo}
                          className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCcw className="w-3 h-3" /> Làm lại câu này
                        </button>
                      </div>
                      <p>{demoQuestion.explanation}</p>
                    </div>
                  )}

                  {/* Simulator Footer */}
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>
                      {!isAnswered ? "Chọn một đáp án bất kỳ để kiểm tra phản hồi tức thì" : "Đã chấm điểm tự động"}
                    </span>
                    <Link
                      href="/dashboard/quizzes"
                      className="text-primary font-medium hover:underline flex items-center gap-1"
                    >
                      <span>Mở toàn bộ đề</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 3. ARCHITECTURAL CAPABILITY LEDGER (NO ICON-GRID SLOP, NO KICKER) ── */}
      <section id="features" className="py-16 md:py-24 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-2xl mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Kiến trúc chuyên biệt cho kỳ thi trắc nghiệm đại học
            </h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Mọi công cụ trên OpenQuiz được thiết kế xoay quanh tài liệu học tập thực tế của sinh viên Việt Nam, loại bỏ hoàn toàn các chi tiết rườm rà.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
            {capabilities.map((item) => (
              <div
                key={item.index}
                id={item.id}
                className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-start hover:bg-secondary/20 transition-colors"
              >
                <div className="lg:col-span-3 flex items-center gap-3">
                  <span className="font-mono text-xs font-semibold px-2 py-1 rounded bg-secondary border border-border text-foreground tabular-nums">
                    {item.index}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground tracking-wider">
                    {item.code}
                  </span>
                </div>

                <div className="lg:col-span-5">
                  <h3 className="text-base sm:text-lg font-semibold text-foreground leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs font-mono text-primary mt-2">
                    {item.spec}
                  </p>
                </div>

                <div className="lg:col-span-4">
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. WORKFLOW PIPELINE ── */}
      <section id="workflow" className="py-16 md:py-24 border-b border-border bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-2xl mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Từ file đề cương đến phòng thi trong 3 bước
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Quy trình tự động hóa hoàn toàn giúp bạn dành 100% thời gian cho việc ghi nhớ kiến thức.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-card border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-secondary border border-border text-foreground tabular-nums">
                  BƯỚC 01
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">.DOCX / TEXT</span>
              </div>
              <h3 className="text-base font-semibold text-foreground">
                Tải lên file Word hoặc dán nội dung
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Kéo thả file đề cương môn học có sẵn. Hệ thống tự động tách câu hỏi, phương án trả lời và hình ảnh đính kèm.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-secondary border border-border text-foreground tabular-nums">
                  BƯỚC 02
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">LIVE PREVIEW</span>
              </div>
              <h3 className="text-base font-semibold text-foreground">
                Kiểm duyệt trực quan bộ câu hỏi
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Rà soát danh sách câu hỏi, đáp án đúng và sơ đồ ở chế độ xem trước. Bổ sung hoặc chỉnh sửa ngay trên trình duyệt.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-secondary border border-border text-foreground tabular-nums">
                  BƯỚC 03
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">PRACTICE &amp; AI</span>
              </div>
              <h3 className="text-base font-semibold text-foreground">
                Luyện thi bấm giờ &amp; Ôn tập câu sai
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Chọn chế độ Ôn tập hoặc Thi thử iTest, xem giải thích từ trợ lý AI và luyện lại các câu làm sai cho đến khi nắm vững.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. COMPARISON TABLE ── */}
      <section id="comparison" className="py-16 md:py-24 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-2xl mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              So sánh hiệu quả ôn tập
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Sự khác biệt giữa việc đọc đề cương tĩnh truyền thống và luyện tập chủ động trên OpenQuiz.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-secondary/50 text-muted-foreground">
                  <th className="p-4 font-semibold text-xs w-[44%]">Tiêu chí đánh giá</th>
                  <th className="p-4 font-semibold text-center text-xs w-[28%]">Đọc Word / PDF thủ công</th>
                  <th className="p-4 font-semibold text-center text-xs text-foreground bg-secondary w-[28%]">OpenQuiz 2.6</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="p-4 font-medium text-foreground">Thời gian tạo đề trắc nghiệm</td>
                  <td className="p-4 text-center text-muted-foreground">Mất hàng giờ nhập thủ công</td>
                  <td className="p-4 text-center font-mono font-semibold text-primary bg-primary/[0.03] tabular-nums">3 giây (Tự động)</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-foreground">Mô phỏng phòng máy thi thật (iTest)</td>
                  <td className="p-4 text-center text-muted-foreground">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <X className="w-3.5 h-3.5 text-rose-500" /> Không hỗ trợ
                    </span>
                  </td>
                  <td className="p-4 text-center font-semibold text-emerald-600 dark:text-emerald-400 bg-primary/[0.03]">
                    <span className="inline-flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Giao diện chuẩn 100%
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-foreground">Trích xuất ảnh sơ đồ, công thức</td>
                  <td className="p-4 text-center text-muted-foreground">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <X className="w-3.5 h-3.5 text-rose-500" /> Lỗi định dạng khi sao chép
                    </span>
                  </td>
                  <td className="p-4 text-center font-semibold text-emerald-600 dark:text-emerald-400 bg-primary/[0.03]">
                    <span className="inline-flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Tự động giữ nguyên ảnh
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-foreground">Cô lập câu sai &amp; Trợ lý AI giải thích</td>
                  <td className="p-4 text-center text-muted-foreground">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <X className="w-3.5 h-3.5 text-rose-500" /> Phải tự ghi chép tay
                    </span>
                  </td>
                  <td className="p-4 text-center font-semibold text-emerald-600 dark:text-emerald-400 bg-primary/[0.03]">
                    <span className="inline-flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Sổ tay + AI Mẹo nhớ 3s
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-foreground">Chi phí sử dụng</td>
                  <td className="p-4 text-center text-muted-foreground">Miễn phí nhưng tốn thời gian</td>
                  <td className="p-4 text-center font-semibold text-foreground bg-primary/[0.03]">Miễn phí 100% &amp; Không quảng cáo</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── 6. SUBJECTS & FINAL CTA ── */}
      <section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-2xl border border-border bg-card flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="space-y-3 max-w-xl">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                Sẵn sàng ôn tập cho kỳ thi học kỳ sắp tới?
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Khởi tạo tài khoản miễn phí trong 15 giây. Truy cập ngay ngân hàng câu hỏi các môn Triết học, Pháp luật đại cương, Cơ sở dữ liệu, Mạng máy tính, Kinh tế chính trị và tự tạo kho đề của riêng bạn.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs sm:text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                <span>Đăng ký miễn phí</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard/quizzes"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-border bg-background hover:bg-secondary text-foreground text-xs sm:text-sm font-medium transition-colors"
              >
                <Laptop className="w-4 h-4 text-muted-foreground" />
                <span>Xem danh sách đề thi</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. FOOTER ── */}
      <footer className="mt-auto border-t border-border bg-card text-muted-foreground py-8 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-foreground text-background flex items-center justify-center font-mono font-bold text-[11px]">
              OQ
            </div>
            <span className="font-semibold text-foreground">OpenQuiz</span>
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
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
