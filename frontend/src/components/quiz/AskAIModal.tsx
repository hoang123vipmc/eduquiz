"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Sparkles, AlertTriangle, RefreshCw, Copy, Check, MessageSquare, Lightbulb, Star, BookmarkCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  id: number;
  option_text: string;
  is_correct?: any;
}

export type AIMode = "explain" | "debate" | "mnemonic";

interface AskAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionText: string;
  options: Option[];
  correctOptionText?: string;
  selectedOptionText?: string;
  quizTitle?: string;
  initialMode?: AIMode;
  autoRun?: boolean;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderMd(text: string) {
  return text.split("\n").map((rawLine, i) => {
    let line = rawLine;
    let type: "h1" | "h2" | "h3" | "ul" | "ol" | "p" | "br" = "p";

    if (line.startsWith("### ")) {
      type = "h3";
      line = line.slice(4);
    } else if (line.startsWith("## ")) {
      type = "h2";
      line = line.slice(3);
    } else if (line.startsWith("# ")) {
      type = "h1";
      line = line.slice(2);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      type = "ul";
      line = line.slice(2);
    } else if (/^\d+\.\s/.test(line)) {
      type = "ol";
      line = line.replace(/^\d+\.\s/, "");
    } else if (line.trim() === "") {
      type = "br";
    }

    if (type === "br") return <br key={i} />;

    // ── Security: HTML-escape before formatting to completely prevent XSS ──
    const escaped = escapeHtml(line);
    const html = escaped
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, '<code style="background:rgba(0,0,0,.08);padding:1px 5px;border-radius:4px;font-size:0.85em">$1</code>');

    switch (type) {
      case "h3":
        return <h3 key={i} className="text-[15px] font-bold mt-3 mb-1 text-foreground" dangerouslySetInnerHTML={{ __html: html }} />;
      case "h2":
        return <h2 key={i} className="text-base font-bold mt-4 mb-1.5 text-foreground" dangerouslySetInnerHTML={{ __html: html }} />;
      case "h1":
        return <h1 key={i} className="text-lg font-bold mt-4 mb-2 text-foreground" dangerouslySetInnerHTML={{ __html: html }} />;
      case "ul":
        return <li key={i} className="ml-5 list-disc my-0.5 leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />;
      case "ol":
        return <li key={i} className="ml-5 list-decimal my-0.5 leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />;
      default:
        return <p key={i} className="leading-relaxed my-0.5" dangerouslySetInnerHTML={{ __html: html }} />;
    }
  });
}

export function AskAIModal({
  isOpen,
  onClose,
  questionText,
  options,
  correctOptionText,
  selectedOptionText,
  quizTitle,
  initialMode = "explain",
  autoRun = false,
}: AskAIModalProps) {
  const [mode, setMode] = useState<AIMode>(initialMode);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [tipSaved, setTipSaved] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const askAI = async (m: AIMode) => {
    setMode(m);
    setLoading(true);
    setError(null);
    setResponse("");
    setTipSaved(false);
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          mode: m,
          questionText,
          options,
          correctOptionText,
          selectedOptionText,
          quizTitle,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.message || `Lỗi máy chủ (${res.status})`);
      }

      const txt = json.data?.text || "";
      if (!txt) throw new Error("AI không trả về kết quả.");
      setResponse(txt);
    } catch (err: any) {
      if (err.name === "AbortError") return;
      setError(err.message || "Lỗi không xác định.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const targetMode = initialMode || "explain";
      setResponse("");
      setError(null);
      setMode(targetMode);
      setTipSaved(false);
      if (autoRun) {
        askAI(targetMode);
      }
    }
  }, [isOpen, questionText, initialMode, autoRun]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleSaveTip = () => {
    try {
      const existing = JSON.parse(localStorage.getItem("eduquiz_saved_tips") || "[]");
      const newTip = {
        id: Date.now(),
        quizTitle: quizTitle || "Chung",
        questionText,
        correctOptionText,
        mode,
        content: response,
        savedAt: new Date().toLocaleDateString("vi-VN"),
      };
      const filtered = existing.filter((item: any) => item.questionText !== questionText || item.mode !== mode);
      localStorage.setItem("eduquiz_saved_tips", JSON.stringify([newTip, ...filtered]));
      setTipSaved(true);
      setTimeout(() => setTipSaved(false), 2500);
    } catch (err) {
      console.error("Save tip failed", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-2xl bg-card border border-border rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center shadow-sm shrink-0 transition-colors",
              mode === "mnemonic"
                ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
                : mode === "debate"
                ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white"
                : "bg-gradient-to-br from-violet-500 to-indigo-600 text-white"
            )}>
              {mode === "mnemonic" ? (
                <Lightbulb className="w-5 h-5 text-white" />
              ) : mode === "debate" ? (
                <AlertTriangle className="w-5 h-5 text-white" />
              ) : (
                <Sparkles className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-foreground text-base leading-tight">Trợ Lý Học Tập AI</h2>
                {mode === "mnemonic" && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    Mẹo Nhớ Siêu Tốc
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Powered by Google Gemini Multi-Model</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Question preview */}
        <div className="px-5 py-3 bg-muted/40 border-b border-border/40 shrink-0">
          <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide mb-1">Câu hỏi đang xem:</p>
          <p className="text-sm text-foreground line-clamp-2 leading-relaxed">{questionText}</p>
        </div>

        {/* 3 Mode buttons */}
        <div className="px-5 pt-4 pb-3 grid grid-cols-3 gap-2 shrink-0">
          {/* Chế độ 1: Giải thích */}
          <button
            onClick={() => askAI("explain")}
            disabled={loading}
            className={cn(
              "flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all border shadow-xs active:scale-[0.98] disabled:opacity-60",
              mode === "explain" && response
                ? "bg-indigo-600 text-white border-indigo-600 shadow-indigo-500/20"
                : "bg-card border-border text-foreground hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
            )}
            title="Giải thích chi tiết tại sao đúng và tại sao các câu khác sai"
          >
            <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">① Giải thích</span>
          </button>

          {/* Chế độ 2: Mẹo nhớ 3s */}
          <button
            onClick={() => askAI("mnemonic")}
            disabled={loading}
            className={cn(
              "flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all border shadow-xs active:scale-[0.98] disabled:opacity-60",
              mode === "mnemonic" && response
                ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/25"
                : "bg-card border-border text-foreground hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600"
            )}
            title="Thần chú từ khóa & mẹo nhận diện đáp án trong 3 giây"
          >
            <Lightbulb className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-amber-500" />
            <span className="truncate">② 💡 Mẹo nhớ</span>
          </button>

          {/* Chế độ 3: Tranh luận */}
          <button
            onClick={() => askAI("debate")}
            disabled={loading}
            className={cn(
              "flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all border shadow-xs active:scale-[0.98] disabled:opacity-60",
              mode === "debate" && response
                ? "bg-amber-500 text-white border-amber-500 shadow-amber-500/20"
                : "bg-card border-border text-foreground hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
            )}
            title="Phân tích khách quan xem đề thi hoặc đáp án có bị sai sót không"
          >
            <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">③ Bắt lỗi đề</span>
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 min-h-0">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center animate-pulse shadow-lg",
                mode === "mnemonic"
                  ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30"
                  : mode === "debate"
                  ? "bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/30"
                  : "bg-gradient-to-br from-violet-500 to-indigo-600 shadow-violet-500/30"
              )}>
                {mode === "mnemonic" ? (
                  <Lightbulb className="w-6 h-6 text-white" />
                ) : (
                  <Sparkles className="w-6 h-6 text-white" />
                )}
              </div>
              <p className="text-sm font-semibold text-foreground">
                {mode === "mnemonic" ? "Đang sáng tạo thần chú & mẹo nhớ 3s..." : "AI đang phân tích câu hỏi..."}
              </p>
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-2 h-2 rounded-full animate-bounce",
                      mode === "mnemonic" ? "bg-emerald-400" : mode === "debate" ? "bg-amber-400" : "bg-violet-400"
                    )}
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">Chưa thể lấy phản hồi</p>
              <p className="text-xs text-muted-foreground max-w-xs">{error}</p>
              <button
                onClick={() => askAI(mode)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Thử lại
              </button>
            </div>
          )}

          {!loading && !error && !response && (
            <div className="flex flex-col items-center justify-center py-8 sm:py-10 gap-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-violet-500/15 to-indigo-600/15 border border-emerald-500/20 flex items-center justify-center shadow-xs">
                <Lightbulb className="w-7 h-7 text-emerald-500" />
              </div>
              <div>
                <p className="text-base font-bold text-foreground mb-1">Chọn chế độ học thông minh</p>
                <p className="text-xs text-muted-foreground">Bấm một trong các nút bên trên để bắt đầu phân tích:</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left w-full max-w-md pt-1">
                <div
                  onClick={() => askAI("explain")}
                  className="p-3 rounded-xl border border-border/80 bg-muted/20 hover:border-indigo-500/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all cursor-pointer"
                >
                  <p className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-500" /> ① Giải thích
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">Hiểu cặn kẽ vì sao đáp án đúng & loại suy đáp án sai.</p>
                </div>

                <div
                  onClick={() => askAI("mnemonic")}
                  className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500 hover:bg-emerald-500/10 transition-all cursor-pointer"
                >
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-1">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> ② Mẹo nhớ 3s
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">Thần chú từ khóa & mẹo nhận diện siêu tốc.</p>
                </div>

                <div
                  onClick={() => askAI("debate")}
                  className="p-3 rounded-xl border border-border/80 bg-muted/20 hover:border-amber-500/50 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-all cursor-pointer"
                >
                  <p className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> ③ Bắt lỗi đề
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">Phản biện nếu đề thi có nhầm lẫn hoặc lỗi sai.</p>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && response && (
            <div>
              {/* Result Toolbar */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-2.5 h-2.5 rounded-full animate-pulse",
                      mode === "mnemonic" ? "bg-emerald-500" : mode === "debate" ? "bg-amber-500" : "bg-indigo-500"
                    )}
                  />
                  <span className="text-xs font-bold text-foreground uppercase tracking-wide">
                    {mode === "mnemonic"
                      ? "💡 Mẹo Nhớ Siêu Tốc & Thần Chú"
                      : mode === "debate"
                      ? "⚖️ Phân Tích Độ Chính Xác Của Đề"
                      : "📖 Giải Thích Chi Tiết Đáp Án"}
                  </span>
                </div>
                
                <div className="flex items-center gap-1.5">
                  {/* Nút Lưu Mẹo vào sổ tay */}
                  <button
                    onClick={handleSaveTip}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer",
                      tipSaved
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold"
                        : "text-muted-foreground hover:text-foreground border-border hover:bg-muted"
                    )}
                    title="Lưu mẹo này vào Sổ tay mẹo học cá nhân"
                  >
                    {tipSaved ? <BookmarkCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Star className="w-3.5 h-3.5" />}
                    <span>{tipSaved ? "Đã lưu mẹo ✓" : "Lưu mẹo"}</span>
                  </button>

                  {/* Nút Sao chép */}
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground border border-border hover:bg-muted transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Đã chép" : "Sao chép"}</span>
                  </button>
                </div>
              </div>

              {/* Rendered content */}
              <div className="bg-muted/30 rounded-xl p-4 sm:p-5 text-sm border border-border/50 space-y-1">
                {renderMd(response)}
              </div>

              {/* Switch to other modes */}
              <div className="flex flex-wrap items-center gap-2 mt-3.5 pt-2">
                <button
                  onClick={() => askAI(mode)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Làm mới
                </button>
                
                {mode !== "mnemonic" && (
                  <button
                    onClick={() => askAI("mnemonic")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors border border-emerald-500/30 cursor-pointer"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span>② Xem mẹo nhớ 3s</span>
                  </button>
                )}

                {mode !== "explain" && (
                  <button
                    onClick={() => askAI("explain")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors border border-indigo-500/30 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>① Giải thích chi tiết</span>
                  </button>
                )}

                {mode !== "debate" && (
                  <button
                    onClick={() => askAI("debate")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors border border-amber-500/30 cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>③ Kiểm tra lỗi đề</span>
                  </button>
                )}
              </div>

              <p className="text-[11px] text-muted-foreground/60 mt-3 leading-relaxed">
                💡 <em>Mẹo học: Hãy áp dụng phương pháp liên tưởng và câu vần để ôn tập lặp lại ngắt quãng (Spaced Repetition).</em>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

