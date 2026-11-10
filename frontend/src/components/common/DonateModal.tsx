"use client";

import React, { useState } from "react";
import { Coffee, Heart, Copy, Check, X, QrCode } from "lucide-react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm rounded-xl bg-card border border-border p-5 sm:p-6 shadow-xl animate-in zoom-in-95 duration-150 space-y-4 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-4 h-4" />
        </button>

        {/* VietQR Code */}
        <div className="pt-1 flex flex-col items-center justify-center space-y-2">
          <div className="relative w-56 max-w-full rounded-xl overflow-hidden border border-border bg-white p-2.5 shadow-xs">
            <img
              src="/images/donate-qr.png"
              alt="Mã VietQR MB Bank DONG HUY HOANG - 0336125598"
              className="w-full h-auto object-contain rounded-lg"
            />
          </div>
          <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
            <QrCode className="w-3.5 h-3.5 text-primary" />
            <span>Quét bằng ứng dụng ngân hàng bất kỳ</span>
          </span>
        </div>

        {/* Message */}
        <div className="text-center space-y-1.5 pt-2 border-t border-border">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-secondary text-foreground border border-border">
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
            <span>Quỹ duy trì hệ thống</span>
          </div>

          <h3 className="text-base font-semibold text-foreground tracking-tight">
            Ủng hộ duy trì máy chủ OpenQuiz
          </h3>

          <p className="text-xs text-muted-foreground leading-relaxed">
            OpenQuiz là nền tảng luyện thi mở và hoàn toàn miễn phí. Mọi đóng góp tùy tâm đều giúp duy trì máy chủ, tên miền và phát triển tính năng mới cho sinh viên.
          </p>
        </div>

        {/* Account Details */}
        <div className="p-3.5 rounded-lg bg-secondary/40 border border-border space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Ngân hàng</span>
            <span className="font-medium text-foreground">{bankName}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Chủ tài khoản</span>
            <span className="font-mono font-medium text-foreground">{accountHolder}</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-muted-foreground">Số tài khoản</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-sm text-primary tabular-nums">
                {accountNumber}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="px-2 py-1 rounded-md bg-card hover:bg-secondary text-foreground border border-border font-medium flex items-center gap-1 transition-colors cursor-pointer"
                title="Sao chép số tài khoản"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-600 font-medium text-[11px]">Đã chép</span>
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

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-medium text-xs hover:bg-primary/90 transition-colors cursor-pointer"
        >
          Đóng cửa sổ
        </button>
      </div>
    </div>
  );
}

export function DonateFloatingButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-20 md:bottom-5 right-3 md:right-5 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2 px-3 py-2 rounded-lg bg-card hover:bg-secondary text-foreground border border-border shadow-md transition-all cursor-pointer"
          title="Ủng hộ quỹ duy trì máy chủ OpenQuiz"
        >
          <Coffee className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-foreground hidden sm:inline">
            Ủng hộ máy chủ
          </span>
        </button>
      </div>

      <DonateModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
