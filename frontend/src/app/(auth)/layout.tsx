import React from "react";
import Link from "next/link";
import { CheckCircle2, FileText, Clock } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground">
      {/* Left Column: Architectural Preview & Brand */}
      <div className="relative hidden md:flex w-1/2 flex-col justify-between bg-secondary/40 p-10 lg:p-14 border-r border-border">
        
        {/* Top Brand Link */}
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-foreground text-background rounded-lg flex items-center justify-center font-mono font-bold text-xs">
              OQ
            </div>
            <span className="text-base font-semibold tracking-tight text-foreground">
              OpenQuiz
            </span>
            <span className="text-[10px] font-mono text-muted-foreground border border-border rounded px-1.5 py-0.5 bg-card">
              2.6
            </span>
          </Link>
        </div>

        {/* Center Architectural Preview Card */}
        <div className="my-auto py-8 max-w-md">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3 text-xs">
              <span className="font-mono font-semibold text-primary flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>KINH_TE_VI_MO.DOCX</span>
              </span>
              <span className="font-mono text-muted-foreground flex items-center gap-1 tabular-nums">
                <Clock className="w-3 h-3" /> 14:20
              </span>
            </div>

            <p className="text-sm font-semibold text-foreground leading-relaxed">
              Khi giá của một hàng hóa tăng lên 10% làm lượng cầu giảm 20%, hệ số co giãn của cầu theo giá có độ lớn bằng bao nhiêu?
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                <span>A. |Ed| = 2.0 (Co giãn nhiều)</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-background text-xs text-muted-foreground">
                <span>B. |Ed| = 0.5 (Ít co giãn)</span>
              </div>
            </div>

            <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] font-mono text-muted-foreground tabular-nums">
              <span>Độ chính xác: 96.4%</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+100 XP</span>
            </div>
          </div>

          <div className="mt-8 space-y-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Không gian luyện thi học thuật chuẩn xác
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Tự động bóc tách đề cương Word, đồng bộ lịch thi và bảng điểm học phần, kết hợp trợ lý phân tích AI miễn phí cho sinh viên.
            </p>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="text-xs text-muted-foreground flex items-center justify-between">
          <span>OpenQuiz — Dự án giáo dục mở</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Bảo mật</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Điều khoản</Link>
          </div>
        </div>
      </div>

      {/* Right Column: Auth Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-background relative">
        {children}
      </div>
    </div>
  );
}
