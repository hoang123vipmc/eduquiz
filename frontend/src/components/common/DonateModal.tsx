"use client";

import React, { useState } from "react";
import { Coffee, Heart, Copy, Check, X, QrCode, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DonateModal({ isOpen, onClose }: DonateModalProps) {
  const [copied, setCopied] = useState(false);
  const accountNumber = "0336125598";
  const bankName = "MB Bank (Ngân hàng Quân Đội)";
  const accountHolder = "DONG HUY HOANG";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm rounded-3xl bg-card border border-border p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-200 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Đóng"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 1. MÃ QR TO & RÕ NÉT Ở TRÊN CÙNG */}
        <div className="pt-2 flex flex-col items-center justify-center space-y-2">
          <div className="relative w-64 max-w-full rounded-2xl overflow-hidden shadow-md border-2 border-primary/20 bg-white p-2">
            <img
              src="/images/donate-qr.png"
              alt="Mã VietQR MB Bank DONG HUY HOANG - 0336125598"
              className="w-full h-auto object-contain rounded-xl"
            />
          </div>
          <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
            <QrCode className="w-3.5 h-3.5 text-primary" />
            <span>Quét bằng app ngân hàng bất kỳ</span>
          </span>
        </div>

        {/* 2. TIÊU ĐỀ & LỜI NHẮN ĐẶT PHÍA DƯỚI ẢNH QR */}
        <div className="text-center space-y-2 pt-1 border-t border-border/50">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <Heart className="w-3 h-3 fill-rose-500" />
            <span>Góc ủng hộ admin</span>
          </div>

          <h3 className="text-base sm:text-lg font-extrabold text-foreground tracking-tight flex items-center justify-center gap-1.5">
            <span>Mời Admin Ly Cà Phê ☕</span>
          </h3>

          <p className="text-xs text-muted-foreground leading-relaxed px-1">
            OpenQuiz là nền tảng luyện thi hoàn toàn miễn phí. Mọi sự ủng hộ dù chỉ là <strong className="text-foreground">2k, 5k hay 10k</strong> đều là nguồn động viên to lớn giúp admin duy trì máy chủ, thức đêm nâng cấp web và <span className="italic text-foreground">góp chút quỹ chữa bệnh trĩ vì ngồi code xuyên màn đêm</span>! 🥰
          </p>
        </div>

        {/* Chi tiết tài khoản & Copy STK */}
        <div className="p-3.5 rounded-2xl bg-card border border-border space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Ngân hàng:</span>
            <span className="font-bold text-foreground">{bankName}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Chủ tài khoản:</span>
            <span className="font-bold text-foreground">{accountHolder}</span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-border/60">
            <span className="text-muted-foreground">Số tài khoản:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-extrabold text-sm text-primary tracking-wider">
                {accountNumber}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="px-2 py-1 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground font-semibold flex items-center gap-1 transition-all active:scale-95"
                title="Sao chép số tài khoản"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-600 font-bold text-[11px]">Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[11px]">Sao chép</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Nút đóng */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-xs hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Cảm ơn tấm lòng của bạn!</span>
        </button>
      </div>
    </div>
  );
}

/**
 * Floating button ở góc nhỏ màn hình để mở mã donate
 */
export function DonateFloatingButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-20 md:bottom-6 right-3 md:right-6 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2 px-3 py-2 md:px-3.5 md:py-2.5 rounded-full bg-card/90 hover:bg-card text-foreground border border-border/80 shadow-md hover:shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95"
          title="Ủng hộ admin ly cà phê / Quỹ duy trì website"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center shadow-xs group-hover:rotate-12 transition-transform">
            <Coffee className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-foreground/90 group-hover:text-primary transition-colors hidden sm:inline">
            Ủng hộ admin ☕
          </span>
          <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            💖
          </span>
        </button>
      </div>

      <DonateModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
