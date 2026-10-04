"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Sparkles, AlertTriangle, RefreshCw, Copy, Check, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  id: number;
  option_text: string;
  is_correct?: any;
}

interface AskAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionText: string;
  options: Option[];
  correctOptionText?: string;
  selectedOptionText?: string;
  quizTitle?: string;
}

type AIMode = "explain" | "debate";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

function buildPrompt(
  mode: AIMode,
  questionText: string,
  options: Option[],
  correctOptionText?: string,
  selectedOptionText?: string,
  quizTitle?: string
): string {
  const letters = ["A", "B", "C", "D", "E", "F"];
  const optsList = options
    .map((opt, i) => {
      const isCorrect =
        opt.is_correct === 1 ||
        opt.is_correct === true ||
        String(opt.is_correct) === "1" ||
        String(opt.is_correct) === "true";
      return `${letters[i]}. ${opt.option_text}${isCorrect ? " ✓ (đáp án theo đề)" : ""}`;
    })
    .join("\n");

  const ctx = [
    `Đề thi: ${quizTitle || "Câu hỏi trắc nghiệm"}`,
    `Câu hỏi: ${questionText}`,
    `Các lựa chọn:\n${optsList}`,
    correctOptionText ? `Đáp án theo đề: ${correctOptionText}` : "",
    selectedOptionText ? `Học sinh chọn: ${selectedOptionText}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  if (mode === "explain") {
    return `${ctx}

Hãy giải thích CHI TIẾT bằng tiếng Việt:
1. **Đáp án đúng** là gì và tại sao?
2. **Tại sao** các đáp án khác sai?
3. **Kiến thức cần nhớ** liên quan?

Trả lời ngắn gọn, dùng markdown.`;
  }
  return `${ctx}

Hãy PHÂN TÍCH KHÁCH QUAN với vai trò chuyên gia:
1. **Đáp án theo đề** có chính xác không? Tại sao?
2. **Nếu đáp án có thể sai**, chỉ ra điểm bất hợp lý và đề xuất đáp án đúng hơn.
3. **Kết luận** đáp án nào chính xác nhất theo kiến thức thực tế?

Trả lời khách quan, có dẫn chứng, bằng tiếng Việt, dùng markdown.`;
}

function renderMd(text: string) {
  return text.split("\n").map((line, i) => {
    let html = line
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, '<code style="background:rgba(0,0,0,.08);padding:1px 5px;border-radius:4px;font-size:0.85em">$1</code>');

    if (line.startsWith("### "))
      return <h3 key={i} className="text-[15px] font-bold mt-3 mb-1" dangerouslySetInnerHTML={{ __html: html.slice(8) }} />;
    if (line.startsWith("## "))
      return <h2 key={i} className="text-base font-bold mt-4 mb-1.5" dangerouslySetInnerHTML={{ __html: html.slice(7) }} />;
    if (line.startsWith("# "))
      return <h1 key={i} className="text-lg font-bold mt-4 mb-2" dangerouslySetInnerHTML={{ __html: html.slice(6) }} />;
    if (line.startsWith("- ") || line.startsWith("* "))
      return <li key={i} className="ml-5 list-disc my-0.5 leading-relaxed" dangerouslySetInnerHTML={{ __html: html.slice(2) }} />;
    if (/^\d+\.\s/.test(line))
      return <li key={i} className="ml-5 list-decimal my-0.5 leading-relaxed" dangerouslySetInnerHTML={{ __html: html.replace(/^\d+\.\s/, "") }} />;
    if (line.trim() === "") return <br key={i} />;
    return <p key={i} className="leading-relaxed my-0.5" dangerouslySetInnerHTML={{ __html: html }} />;
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
}: AskAIModalProps) {
  const [mode, setMode] = useState<AIMode>("explain");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isOpen) {
      setResponse("");
      setError(null);
      setMode("explain");
    }
  }, [isOpen, questionText]);

  const askAI = async (m: AIMode) => {
    setMode(m);
    setLoading(true);
    setError(null);
    setResponse("");
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      setError("Chưa cấu hình Gemini API key.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildPrompt(m, questionText, options, correctOptionText, selectedOptionText, quizTitle) }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.error?.message || `Lỗi ${res.status}`);
      }
      const data = await res.json();
      const txt = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (!txt) throw new Error("AI không trả về kết quả.");
      setResponse(txt);
    } catch (err: any) {
      if (err.name === "AbortError") return;
      setError(err.message || "Lỗi không xác định.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(response); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-2xl bg-card border border-border rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-foreground text-base leading-tight">Hỏi AI</h2>
              <p className="text-xs text-muted-foreground">Powered by Google Gemini</p>
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

        {/* Mode buttons */}
        <div className="px-5 pt-4 pb-3 flex gap-2.5 shrink-0">
          <button
            onClick={() => askAI("explain")}
            disabled={loading}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all border shadow-xs active:scale-[0.98] disabled:opacity-60",
              mode === "explain" && response
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-card border-border text-foreground hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
            )}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span>① Giải thích đáp án</span>
          </button>
          <button
            onClick={() => askAI("debate")}
            disabled={loading}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all border shadow-xs active:scale-[0.98] disabled:opacity-60",
              mode === "debate" && response
                ? "bg-amber-500 text-white border-amber-500"
                : "bg-card border-border text-foreground hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
            )}
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>② Đáp án có đúng?</span>
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 min-h-0">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center animate-pulse shadow-lg shadow-violet-500/30">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-medium text-foreground">AI đang phân tích...</p>
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">Có lỗi xảy ra</p>
              <p className="text-xs text-muted-foreground max-w-xs">{error}</p>
              <button onClick={() => askAI(mode)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
                <RefreshCw className="w-3.5 h-3.5" /> Thử lại
              </button>
            </div>
          )}

          {!loading && !error && !response && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/15 to-indigo-600/15 border border-violet-500/20 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-violet-500" />
              </div>
              <p className="text-sm font-semibold text-foreground">Chọn chế độ để hỏi AI</p>
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                <strong>① Giải thích:</strong> Hiểu tại sao đáp án đúng/sai<br />
                <strong>② Đáp án có đúng?:</strong> AI tranh luận nếu đề có sai
              </p>
            </div>
          )}

          {!loading && !error && response && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", mode === "explain" ? "bg-indigo-500" : "bg-amber-500")} />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {mode === "explain" ? "Giải thích từ AI" : "Phân tích độ chính xác"}
                  </span>
                </div>
                <button onClick={handleCopy} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-muted-foreground hover:bg-muted transition-colors">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Đã sao chép" : "Sao chép"}
                </button>
              </div>
              <div className="bg-muted/30 rounded-xl p-4 text-sm border border-border/40 space-y-0.5">
                {renderMd(response)}
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => askAI(mode)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-muted transition-colors border border-border">
                  <RefreshCw className="w-3 h-3" /> Hỏi lại
                </button>
                <button onClick={() => askAI(mode === "explain" ? "debate" : "explain")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-primary hover:bg-primary/10 transition-colors border border-primary/20">
                  <Sparkles className="w-3 h-3" />
                  {mode === "explain" ? "② Kiểm tra đáp án" : "① Giải thích thêm"}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground/60 mt-2 leading-relaxed">
                ⚠️ AI có thể mắc lỗi. Hãy đối chiếu với giáo trình và thảo luận với giảng viên.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
