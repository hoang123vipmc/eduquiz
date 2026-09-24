"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Home, 
  RefreshCcw, 
  ChevronDown, 
  ChevronUp, 
  HelpCircle,
  Eye,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function QuizResultPage() {
  const { id } = useParams();
  const router = useRouter();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(true);
  const [filterMode, setFilterMode] = useState<"all" | "wrong" | "correct">("all");

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const { data } = await api.get(`/results/${id}`);
        if (data.success) {
          setResult(data.data);
        } else {
          setError(data.message || "Không thể tải kết quả bài thi.");
        }
      } catch (err: any) {
        console.error("Lỗi lấy kết quả", err);
        setError(err.response?.data?.message || "Không tìm thấy kết quả hoặc bài thi chưa kết thúc.");
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-border border-t-primary rounded-full animate-spin mb-4"></div>
        <p className="text-muted-foreground font-medium text-sm">Đang tải kết quả bài thi...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Không thể tải kết quả</h2>
        <p className="text-muted-foreground max-w-md mb-6 text-sm">
          {error || "Không tìm thấy dữ liệu kết quả thi cho lượt làm này."}
        </p>
        <button 
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all active:scale-[0.98] shadow-sm"
        >
          <Home className="w-4 h-4" /> Về trang tổng quan
        </button>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m} phút ${s} giây`;
  };

  const isPass = result.score >= (result.attempt?.quiz?.passing_score || 50);
  const quizTitle = result.attempt?.quiz?.title || "Đề thi";
  const categoryName = result.attempt?.quiz?.category?.name;
  const questionsDetail: any[] = result.questions_detail || [];

  const filteredQuestions = questionsDetail.filter(q => {
    if (filterMode === "wrong") return !q.is_correct;
    if (filterMode === "correct") return q.is_correct;
    return true;
  });

  return (
    <div className="min-h-screen bg-background py-10 px-4 animate-in fade-in duration-500 text-foreground">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Quiz Title Banner */}
        <div className="text-center space-y-2">
          {categoryName && (
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-[#4F7CFF] border border-blue-500/20 mb-1">
              {categoryName}
            </span>
          )}
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            {quizTitle}
          </h2>
          <p className="text-sm text-muted-foreground">
            Hoàn thành lúc {new Date(result.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(result.created_at).toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </p>
        </div>

        {/* Điểm số tổng quan Card */}
        <div className="relative overflow-hidden rounded-[24px] bg-card border border-border shadow-[0_8px_30px_rgba(0,0,0,0.3)] text-center p-8">
          <div 
            className="absolute -top-24 -left-24 w-64 h-64 rounded-full pointer-events-none opacity-20"
            style={{ background: isPass ? 'radial-gradient(circle, #10B981, transparent 70%)' : 'radial-gradient(circle, #EF4444, transparent 70%)' }}
          />

          <div className="w-24 h-24 rounded-full border-4 border-card mx-auto flex items-center justify-center shadow-lg relative z-10 mb-4 bg-muted">
            {isPass ? (
              <CheckCircle2 className="w-14 h-14 text-emerald-400" />
            ) : (
              <XCircle className="w-14 h-14 text-rose-500" />
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold">
            {isPass ? "Chúc mừng bạn đã hoàn thành xuất sắc!" : "Rất tiếc, bạn chưa đạt điểm qua môn!"}
          </h1>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto text-sm">
            {isPass 
              ? "Bạn đã nắm vững kiến thức đề thi. Hãy tiếp tục duy trì phong độ!" 
              : "Đừng nản lòng! Hãy xem lại các câu sai dưới đây để cải thiện kiến thức nhé."}
          </p>
          
          <div className="mt-6 flex items-baseline justify-center gap-1">
            <span 
              className="text-6xl sm:text-7xl font-black tracking-tight"
              style={{ color: isPass ? '#10B981' : '#EF4444' }}
            >
              {result.score}
            </span>
            <span className="text-2xl font-semibold text-muted-foreground">/100</span>
          </div>

          <div className="mt-3 text-sm font-medium text-muted-foreground">
            Độ chính xác: <span className="font-bold text-foreground">{result.accuracy}%</span>
          </div>
        </div>

        {/* Thống kê 4 ô chi tiết */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-card border border-border text-center space-y-1">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Đúng</p>
            <p className="text-2xl font-bold text-emerald-400">{result.correct_answers}</p>
          </div>
          <div className="p-5 rounded-2xl bg-card border border-border text-center space-y-1">
            <XCircle className="w-6 h-6 text-rose-500 mx-auto mb-2" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sai</p>
            <p className="text-2xl font-bold text-rose-500">{result.wrong_answers}</p>
          </div>
          <div className="p-5 rounded-2xl bg-card border border-border text-center space-y-1">
            <AlertCircle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bỏ qua</p>
            <p className="text-2xl font-bold text-amber-500">{result.skipped_answers}</p>
          </div>
          <div className="p-5 rounded-2xl bg-card border border-border text-center space-y-1">
            <Clock className="w-6 h-6 text-[#4F7CFF] mx-auto mb-2" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Thời gian</p>
            <p className="text-xl font-bold text-foreground">{formatTime(result.time_taken_seconds)}</p>
          </div>
        </div>

        {/* Buttons Action Bar */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button 
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border border-border bg-card hover:bg-muted active:scale-[0.98] text-foreground font-semibold text-sm transition-all shadow-sm"
          >
            <Home className="w-4 h-4" /> Về trang chủ
          </button>
          <button 
            onClick={() => router.push(`/play/${result.attempt?.quiz_id || id}`)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary hover:bg-primary/90 active:scale-[0.98] text-primary-foreground font-semibold text-sm transition-all shadow-md shadow-primary/20"
          >
            <RefreshCcw className="w-4 h-4" /> Thi lại từ đầu
          </button>
          {result.wrong_answers > 0 && (
            <button 
              onClick={() => router.push(`/play/${result.attempt?.quiz_id}?retry_attempt=${result.attempt_id}`)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 active:scale-[0.98] text-amber-700 dark:text-amber-400 border border-amber-500/20 font-semibold text-sm transition-all"
            >
              <AlertCircle className="w-4 h-4" /> Làm lại {result.wrong_answers} câu sai
            </button>
          )}
        </div>

        {/* Review Breakdown Section */}
        {questionsDetail.length > 0 && (
          <div className="space-y-4 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Chi tiết câu hỏi & Lời giải</h3>
                  <p className="text-xs text-muted-foreground">Xem lại từng câu hỏi, lựa chọn của bạn và đáp án chính xác</p>
                </div>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-1.5 bg-muted p-1 rounded-xl self-start sm:self-auto text-xs font-semibold">
                <button
                  onClick={() => setFilterMode("all")}
                  className={cn("px-3 py-1.5 rounded-lg transition-colors", filterMode === "all" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                >
                  Tất cả ({questionsDetail.length})
                </button>
                <button
                  onClick={() => setFilterMode("wrong")}
                  className={cn("px-3 py-1.5 rounded-lg transition-colors", filterMode === "wrong" ? "bg-card text-rose-700 dark:text-rose-400 shadow-sm" : "text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400")}
                >
                  Câu sai ({questionsDetail.filter(q => !q.is_correct).length})
                </button>
                <button
                  onClick={() => setFilterMode("correct")}
                  className={cn("px-3 py-1.5 rounded-lg transition-colors", filterMode === "correct" ? "bg-card text-emerald-700 dark:text-emerald-400 shadow-sm" : "text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400")}
                >
                  Câu đúng ({questionsDetail.filter(q => q.is_correct).length})
                </button>
              </div>
            </div>

            {/* Questions List */}
            {filteredQuestions.length === 0 ? (
              <div className="p-8 text-center bg-card border border-border rounded-2xl">
                <p className="text-sm font-medium text-muted-foreground">
                  {filterMode === "wrong" 
                    ? "Tuyệt vời! Bạn không làm sai câu nào trong bài thi này." 
                    : filterMode === "correct" 
                    ? "Chưa có câu trả lời chính xác nào." 
                    : "Không có câu hỏi nào để hiển thị."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
              {filteredQuestions.map((q, idx) => {
                const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

                return (
                  <div 
                    key={q.id || idx} 
                    className={cn(
                      "p-6 rounded-[20px] bg-card border transition-all",
                      q.is_correct ? "border-emerald-500/20" : "border-rose-500/20"
                    )}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Câu {idx + 1}
                        </span>
                        {q.is_correct ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Đúng
                          </span>
                        ) : !q.is_answered ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                            <AlertCircle className="w-3.5 h-3.5" /> Bỏ qua
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                            <XCircle className="w-3.5 h-3.5" /> Sai
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{q.points || 1} Điểm</span>
                    </div>

                    {/* Question text */}
                    <p className="text-[16px] font-semibold text-foreground mb-5 leading-relaxed break-words">
                      {q.question_text}
                    </p>

                    {/* Options */}
                    <div className="space-y-2.5">
                      {q.options?.map((opt: any, optIdx: number) => {
                        const isSelected = q.selected_option_id === opt.id;
                        const isOptCorrect = opt.is_correct;

                        let optClass = "border-border bg-secondary/40 text-muted-foreground";
                        let badgeClass = "bg-muted text-muted-foreground";

                        if (isOptCorrect) {
                          optClass = "border-emerald-500/50 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-medium";
                          badgeClass = "bg-emerald-500 text-white font-bold";
                        } else if (isSelected && !isOptCorrect) {
                          optClass = "border-rose-500/50 bg-rose-500/10 text-rose-800 dark:text-rose-300 font-medium";
                          badgeClass = "bg-rose-500 text-white font-bold";
                        }

                        return (
                          <div 
                            key={opt.id || optIdx}
                            className={cn(
                              "flex items-center justify-between p-3.5 rounded-xl border text-sm transition-all gap-3",
                              optClass
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <span className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0", badgeClass)}>
                                {letters[optIdx] || optIdx + 1}
                              </span>
                              <span className="break-words min-w-0 flex-1">{opt.option_text?.replace(/^(\*?\s*[A-F1-6]\s*[\.\)\-]\s*)+/i, '').trim()}</span>
                            </div>
                            <div className="shrink-0 text-xs font-bold pl-2">
                              {isOptCorrect && <span className="text-emerald-700 dark:text-emerald-400">Đáp án đúng</span>}
                              {isSelected && !isOptCorrect && <span className="text-rose-700 dark:text-rose-400">Bạn đã chọn</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation if present */}
                    {q.explanation && (
                      <div className="mt-4 p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                        <span className="font-bold text-[#4F7CFF]">Giải thích: </span>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
