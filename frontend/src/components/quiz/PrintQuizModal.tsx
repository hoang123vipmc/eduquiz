"use client";

import React, { useEffect, useState } from "react";
import { X, Printer, Loader2, BookOpen, Clock, FileText, CheckCircle2, Eye, EyeOff } from "lucide-react";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";

interface PrintQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: any;
}

export function PrintQuizModal({ isOpen, onClose, quiz }: PrintQuizModalProps) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !quiz?.id) return;

    const fetchQuestions = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get(`/quizzes/${quiz.id}/questions`);
        if (data.success) {
          setQuestions(data.data || []);
        } else {
          setError("Không thể tải danh sách câu hỏi.");
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Lỗi khi lấy dữ liệu câu hỏi.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [isOpen, quiz?.id]);

  if (!isOpen || !quiz) return null;

  const handlePrint = () => {
    window.print();
  };

  const letters = ["A", "B", "C", "D", "E", "F"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl bg-card rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Controls Bar (hidden during print) */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/40 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-foreground text-base">Xem & In Đề Thi Ra Giấy</h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle show answers */}
            <button
              onClick={() => setShowAnswers(!showAnswers)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                showAnswers 
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" 
                  : "bg-card text-muted-foreground border-border hover:text-foreground"
              )}
            >
              {showAnswers ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{showAnswers ? "Đang hiện đáp án" : "Ẩn đáp án (Đề trắng)"}</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              disabled={loading || questions.length === 0}
              className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-1.5 rounded-lg font-bold text-xs transition-all shadow-xs disabled:opacity-50"
            >
              <Printer className="w-4 h-4" /> In / Tải PDF
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              aria-label="Đóng"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Content Viewport */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-card text-foreground" id="printable-exam-sheet">
          {loading ? (
            <div className="p-16 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Đang chuẩn bị bản in đề thi...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center text-rose-500">
              <p className="text-sm font-semibold">{error}</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <p className="text-sm">Đề thi này chưa có câu hỏi nào để in.</p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-6">
              
              {/* Paper Header */}
              <div className="border-b-2 border-black dark:border-border pb-4 text-center space-y-1.5">
                <div className="flex justify-between items-center text-xs text-muted-foreground font-mono">
                  <span>HỆ THỐNG LUYỆN THI EDUQUIZ</span>
                  <span>{quiz.category?.name || "HỌC PHẦN ÔN THI"}</span>
                </div>
                <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-foreground">
                  {quiz.title}
                </h1>
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-1">
                  <span>Số câu: <strong>{questions.length} câu</strong></span>
                  <span>•</span>
                  <span>Thời gian: <strong>{quiz.duration_minutes || 60} phút</strong></span>
                  {showAnswers && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">(BẢN CÓ ĐÁP ÁN)</span>
                    </>
                  )}
                </div>

                {/* Candidate Info Line (if printing blank exam) */}
                {!showAnswers && (
                  <div className="pt-4 pb-1 grid grid-cols-2 text-xs text-left text-muted-foreground gap-4 font-mono">
                    <div>Họ và tên: ................................................................</div>
                    <div>Mã SV / SBD: .....................................................</div>
                  </div>
                )}
              </div>

              {/* Questions List */}
              <div className="space-y-6 pt-2">
                {questions.map((q, qIdx) => (
                  <div key={q.id || qIdx} className="space-y-2.5 break-inside-avoid">
                    <p className="font-bold text-sm md:text-base text-foreground leading-relaxed">
                      <span className="text-primary font-black">Câu {qIdx + 1}:</span> {q.question_text}
                    </p>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-2">
                      {q.options?.map((opt: any, optIdx: number) => {
                        const isCorrect = showAnswers && (opt.is_correct === true || opt.is_correct === 1 || String(opt.is_correct) === '1');
                        return (
                          <div 
                            key={opt.id || optIdx}
                            className={cn(
                              "flex items-start gap-2 p-2 rounded-lg text-xs md:text-sm border transition-colors",
                              isCorrect 
                                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-bold" 
                                : "border-border/60 bg-muted/20 text-foreground"
                            )}
                          >
                            <span className="font-bold shrink-0">{letters[optIdx] || optIdx + 1}.</span>
                            <span className="flex-1">{opt.option_text}</span>
                            {isCorrect && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {showAnswers && q.explanation && (
                      <div className="pl-3 py-1 text-xs text-muted-foreground italic border-l-2 border-primary/40">
                        <strong>Giải thích:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="border-t border-border pt-4 text-center text-xs text-muted-foreground">
                <p>EduQuiz — Học tập thông minh • Chúc bạn ôn tập tốt và đạt kết quả cao!</p>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
