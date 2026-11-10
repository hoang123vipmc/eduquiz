"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Sparkles, AlertTriangle, RefreshCw, Copy, Check, MessageSquare, Lightbulb, Star, BookmarkCheck, Loader2 } from "lucide-react";
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

    const escaped = escapeHtml(line);
    const html = escaped
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-secondary border border-border font-mono text-[12px]">$1</code>');

    switch (type) {
      case "h3":
        return <h3 key={i} className="text-sm font-semibold mt-3 mb-1 text-foreground" dangerouslySetInnerHTML={{ __html: html }} />;
      case "h2":
        return <h2 key={i} className="text-[15px] font-semibold mt-4 mb-1.5 text-foreground" dangerouslySetInnerHTML={{ __html: html }} />;
      case "h1":
        return <h1 key={i} className="text-base font-semibold mt-4 mb-2 text-foreground" dangerouslySetInnerHTML={{ __html: html }} />;
      case "ul":
        return <li key={i} className="ml-5 list-disc my-0.5 leading-relaxed text-foreground/90" dangerouslySetInnerHTML={{ __html: html }} />;
      case "ol":
        return <li key={i} className="ml-5 list-decimal my-0.5 leading-relaxed text-foreground/90" dangerouslySetInnerHTML={{ __html: html }} />;
      default:
        return <p key={i} className="leading-relaxed my-0.5 text-foreground/90" dangerouslySetInnerHTML={{ __html: html }} />;
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
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full sm:max-w-2xl bg-card border border-border rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-secondary/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 transition-colors",
              mode === "mnemonic"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : mode === "debate"
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                : "bg-primary/10 text-primary border-primary/20"
            )}>
              {mode === "mnemonic" ? (
                <Lightbulb className="w-4 h-4" />
              ) : mode === "debate" ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-foreground text-sm leading-tight">Trợ lý phân tích AI</h2>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-secondary text-muted-foreground border border-border">
                  Gemini 2.5
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Giải thích chuyên sâu, tạo từ khóa ghi nhớ và đối chiếu đề</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Question Context */}
        <div className="px-5 py-3 bg-secondary/20 border-b border-border shrink-0">
          <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Câu hỏi đang phân tích</p>
          <p className="text-xs sm:text-sm text-foreground line-clamp-2 leading-relaxed font-medium">{questionText}</p>
        </div>

        {/* Mode Segmented Control */}
        <div className="px-5 pt-3.5 pb-3 shrink-0">
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-lg bg-secondary/60 border border-border">
            <button
              onClick={() => askAI("explain")}
              disabled={loading}
              className={cn(
                "flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md font-medium text-xs transition-all cursor-pointer disabled:opacity-60",
                mode === "explain"
                  ? "bg-card text-foreground border border-border shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MessageSquare className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate">Giải thích</span>
            </button>

            <button
              onClick={() => askAI("mnemonic")}
              disabled={loading}
              className={cn(
                "flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md font-medium text-xs transition-all cursor-pointer disabled:opacity-60",
                mode === "mnemonic"
                  ? "bg-card text-foreground border border-border shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Lightbulb className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="truncate">Mẹo nhớ 3s</span>
            </button>

            <button
              onClick={() => askAI("debate")}
              disabled={loading}
              className={cn(
                "flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md font-medium text-xs transition-all cursor-pointer disabled:opacity-60",
                mode === "debate"
                  ? "bg-card text-foreground border border-border shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate">Kiểm tra đề</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 min-h-0">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary border border-border flex items-center justify-center text-primary">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
              <p className="text-xs font-medium text-foreground">
                {mode === "mnemonic" ? "Đang trích xuất từ khóa và mẹo nhận diện 3 giây..." : "Đang phân tích dữ liệu câu hỏi..."}
              </p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-foreground">Không thể kết nối trợ lý AI</p>
              <p className="text-xs text-muted-foreground max-w-xs">{error}</p>
              <button
                onClick={() => askAI(mode)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Thử lại
              </button>
            </div>
          )}

          {!loading && !error && !response && (
            <div className="py-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                Chọn một chế độ phân tích bên dưới để bắt đầu:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left">
                <button
                  type="button"
                  onClick={() => askAI("explain")}
                  className="p-3.5 rounded-lg border border-border bg-secondary/20 hover:bg-secondary/60 hover:border-foreground/20 transition-all text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-foreground">Giải thích chi tiết</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Phân tích cơ sở lý thuyết của đáp án đúng và loại trừ từng phương án nhiễu.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => askAI("mnemonic")}
                  className="p-3.5 rounded-lg border border-border bg-secondary/20 hover:bg-secondary/60 hover:border-foreground/20 transition-all text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Lightbulb className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-semibold text-foreground">Mẹo nhớ 3 giây</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Trích xuất cặp từ khóa neo (anchor keywords) để khoanh nhanh trong phòng thi.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => askAI("debate")}
                  className="p-3.5 rounded-lg border border-border bg-secondary/20 hover:bg-secondary/60 hover:border-foreground/20 transition-all text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-semibold text-foreground">Kiểm tra lỗi đề</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Đối chiếu độc lập xem câu hỏi hoặc đáp án gốc trong đề cương có sai sót không.
                  </p>
                </button>
              </div>
            </div>
          )}

          {!loading && !error && response && (
            <div className="space-y-3">
              {/* Result Toolbar */}
              <div className="flex items-center justify-between pb-2.5 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    mode === "mnemonic" ? "bg-emerald-500" : mode === "debate" ? "bg-amber-500" : "bg-primary"
                  )} />
                  <span className="text-xs font-semibold text-foreground">
                    {mode === "mnemonic"
                      ? "Từ khóa & Mẹo nhận diện nhanh"
                      : mode === "debate"
                      ? "Báo cáo đối chiếu độ chính xác"
                      : "Phân tích & Giải thích đáp án"}
                  </span>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleSaveTip}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer",
                      tipSaved
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                        : "text-muted-foreground hover:text-foreground border-border hover:bg-secondary"
                    )}
                    title="Lưu vào sổ tay cá nhân"
                  >
                    {tipSaved ? <BookmarkCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Star className="w-3.5 h-3.5" />}
                    <span>{tipSaved ? "Đã lưu" : "Lưu ghi chú"}</span>
                  </button>

                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground border border-border hover:bg-secondary transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Đã chép" : "Sao chép"}</span>
                  </button>
                </div>
              </div>

              {/* Rendered Markdown */}
              <div className="bg-secondary/20 rounded-lg p-4 text-xs sm:text-sm border border-border space-y-1">
                {renderMd(response)}
              </div>

              {/* Quick Actions Footer */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <button
                  onClick={() => askAI(mode)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors border border-border cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Tạo lại phân tích
                </button>
                
                <div className="flex items-center gap-1.5">
                  {mode !== "mnemonic" && (
                    <button
                      onClick={() => askAI("mnemonic")}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-foreground bg-secondary/60 hover:bg-secondary transition-colors border border-border cursor-pointer"
                    >
                      <Lightbulb className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Xem mẹo nhớ 3s</span>
                    </button>
                  )}

                  {mode !== "explain" && (
                    <button
                      onClick={() => askAI("explain")}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-foreground bg-secondary/60 hover:bg-secondary transition-colors border border-border cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-primary" />
                      <span>Giải thích chi tiết</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
