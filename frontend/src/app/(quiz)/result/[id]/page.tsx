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
  Filter,
  Printer,
  Share2,
  Check,
  Settings,
  Bookmark,
  Trophy,
  Award,
  Sparkles,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FormattedText, cleanOptionPrefix } from "@/components/quiz/FormattedText";
import { QuizSettingsModal } from "@/components/quiz/QuizSettingsModal";
import { useAuthStore } from "@/store/authStore";

export default function QuizResultPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(true);
  const [filterMode, setFilterMode] = useState<"all" | "wrong" | "correct">("all");
  const [copied, setCopied] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showScorecardModal, setShowScorecardModal] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<number[]>([]);

  useEffect(() => {
    const fetchBookmarkIds = async () => {
      try {
        const res = await api.get('/bookmarks/ids');
        if (res.data?.success) {
          setBookmarkedIds(res.data.bookmarked_ids || []);
        }
      } catch (e) {
        // ignore
      }
    };
    fetchBookmarkIds();
  }, []);

  const handleToggleBookmark = async (questionId: number) => {
    try {
      const res = await api.post('/bookmarks/toggle', { question_id: questionId });
      if (res.data?.success) {
        if (res.data.is_bookmarked) {
          setBookmarkedIds(prev => [...prev, questionId]);
        } else {
          setBookmarkedIds(prev => prev.filter(qId => qId !== questionId));
        }
      }
    } catch (err) {
      console.error("Lỗi lưu bookmark", err);
    }
  };

  const handleStartWithConfig = (config: any) => {
    const quizId = result?.attempt?.quiz_id || result?.quiz_id;
    if (!quizId) return;
    const query = new URLSearchParams({
      mode: config.examMode,
      shuffleQ: config.shuffleQuestions ? '1' : '0',
      shuffleO: config.shuffleOptions ? '1' : '0',
      delay: config.autoNextDelay,
      unlimited: config.unlimitedTime ? '1' : '0',
      fresh: '1',
      limit: config.questionLimit ? String(config.questionLimit) : '0',
      theme: config.theme || 'modern'
    }).toString();
    setShowSettingsModal(false);
    router.push(`/play/${quizId}?${query}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      alert("Liên kết: " + url);
    }
  };

  const handleShare = () => {
    setShowScorecardModal(true);
  };

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="p-3.5 sm:p-5 rounded-2xl bg-card border border-border text-center space-y-1">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 mx-auto mb-1.5" />
            <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Đúng</p>
            <p className="text-xl sm:text-2xl font-bold text-emerald-400">{result.correct_answers}</p>
          </div>
          <div className="p-3.5 sm:p-5 rounded-2xl bg-card border border-border text-center space-y-1">
            <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500 mx-auto mb-1.5" />
            <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sai</p>
            <p className="text-xl sm:text-2xl font-bold text-rose-500">{result.wrong_answers}</p>
          </div>
          <div className="p-3.5 sm:p-5 rounded-2xl bg-card border border-border text-center space-y-1">
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 mx-auto mb-1.5" />
            <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bỏ qua</p>
            <p className="text-xl sm:text-2xl font-bold text-amber-500">{result.skipped_answers}</p>
          </div>
          <div className="p-3.5 sm:p-5 rounded-2xl bg-card border border-border text-center space-y-1">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-[#4F7CFF] mx-auto mb-1.5" />
            <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Thời gian</p>
            <p className="text-base sm:text-xl font-bold text-foreground">{formatTime(result.time_taken_seconds)}</p>
          </div>
        </div>

        {/* Printable Official Header (only visible when printing) */}
        <div className="hidden print:block text-center border-b border-gray-300 pb-4 mb-6">
          <h1 className="text-2xl font-bold uppercase tracking-wider text-black">OpenQuiz — Báo Cáo Kết Quả Bài Thi</h1>
          <p className="text-sm text-gray-600 mt-1">Hệ thống khảo sát & Đánh giá năng lực học tập trực tuyến (Phi thương mại)</p>
        </div>

        {/* Buttons Action Bar */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 print:hidden">
          <button 
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl border border-border bg-card hover:bg-muted active:scale-[0.98] text-foreground font-semibold text-xs sm:text-sm transition-all shadow-xs"
          >
            <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Về trang chủ
          </button>
          {/* Nút làm lại chính: Tự động phân biệt Ôn tập lại hoặc Thi lại từ đầu */}
          <button 
            onClick={() => {
              const quizId = result?.attempt?.quiz_id || result?.quiz_id || id;
              const mode = result?.attempt?.mode || 'practice';
              const query = new URLSearchParams({
                mode: mode,
                unlimited: mode === 'practice' ? '1' : '0',
                fresh: '1'
              }).toString();
              router.push(`/play/${quizId}?${query}`);
            }}
            className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-primary hover:bg-primary/90 active:scale-[0.98] text-primary-foreground font-semibold text-xs sm:text-sm transition-all shadow-md shadow-primary/20"
          >
            <RefreshCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
            {result?.attempt?.mode === 'practice' ? 'Ôn tập lại từ đầu' : 'Thi lại từ đầu'}
          </button>
          <button 
            onClick={() => setShowSettingsModal(true)}
            title="Đổi chế độ làm bài (Ôn thi / Thi thử, xáo trộn câu hỏi...)"
            className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-border bg-card hover:bg-muted active:scale-[0.98] text-foreground font-semibold text-xs sm:text-sm transition-all shadow-xs"
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" /> Chế độ khác
          </button>
          {result.wrong_answers > 0 && (
            <button 
              onClick={() => {
                const quizId = result.attempt?.quiz_id || result.quiz_id || (result.attempt && result.attempt.quiz ? result.attempt.quiz.id : null);
                const attemptId = result.attempt_id || result.attempt?.id || id;
                if (quizId) {
                  router.push(`/play/${quizId}?retry_attempt=${attemptId}`);
                } else {
                  router.push(`/play/${id}?retry_attempt=${attemptId}`);
                }
              }}
              className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 active:scale-[0.98] text-amber-700 dark:text-amber-400 border border-amber-500/20 font-semibold text-xs sm:text-sm transition-all"
            >
              <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Làm lại {result.wrong_answers} câu sai
            </button>
          )}
          <button
            onClick={handlePrint}
            title="In hoặc lưu kết quả bài thi dưới dạng tệp PDF"
            className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl border border-border bg-card hover:bg-muted active:scale-[0.98] text-foreground font-semibold text-xs sm:text-sm transition-all shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" /> In / PDF
          </button>
          <button
            onClick={handleShare}
            title="Chia sẻ kết quả bài thi"
            className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl border border-border bg-card hover:bg-muted active:scale-[0.98] text-foreground font-semibold text-xs sm:text-sm transition-all shadow-xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
                <span className="text-emerald-500">Đã copy link!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
                <span>Chia sẻ</span>
              </>
            )}
          </button>
        </div>

        {/* Review Breakdown Section */}
        {questionsDetail.length > 0 && (
          <div className="space-y-4 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground">Chi tiết câu hỏi & Lời giải</h3>
                  <p className="text-xs text-muted-foreground">Xem lại từng câu hỏi, lựa chọn của bạn và đáp án chính xác</p>
                </div>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-1 bg-muted p-1 rounded-xl self-start sm:self-auto text-xs font-semibold print:hidden overflow-x-auto max-w-full">
                <button
                  onClick={() => setFilterMode("all")}
                  className={cn("px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap", filterMode === "all" ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground")}
                >
                  Tất cả ({questionsDetail.length})
                </button>
                <button
                  onClick={() => setFilterMode("wrong")}
                  className={cn("px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap", filterMode === "wrong" ? "bg-card text-rose-700 dark:text-rose-400 shadow-2xs" : "text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400")}
                >
                  Câu sai ({questionsDetail.filter(q => !q.is_correct).length})
                </button>
                <button
                  onClick={() => setFilterMode("correct")}
                  className={cn("px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap", filterMode === "correct" ? "bg-card text-emerald-700 dark:text-emerald-400 shadow-2xs" : "text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400")}
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
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleBookmark(q.id)}
                          className={cn(
                            "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer",
                            bookmarkedIds.includes(q.id)
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40"
                              : "bg-muted/60 text-muted-foreground border-border hover:text-foreground hover:bg-muted"
                          )}
                          title={bookmarkedIds.includes(q.id) ? "Đã lưu vào Sổ tay câu khó" : "Lưu vào Sổ tay câu khó"}
                        >
                          <Bookmark className={cn("w-3.5 h-3.5", bookmarkedIds.includes(q.id) && "fill-amber-500 text-amber-500")} />
                          <span>{bookmarkedIds.includes(q.id) ? "Đã lưu" : "Lưu câu khó"}</span>
                        </button>
                        <span className="text-xs text-muted-foreground">{q.points || 1} Điểm</span>
                      </div>
                    </div>

                    {/* Question text */}
                    <div className="text-[16px] font-semibold text-foreground mb-5 leading-relaxed break-words">
                      <FormattedText text={q.question_text} />
                    </div>

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
                              <span className="break-words min-w-0 flex-1">
                                <FormattedText text={cleanOptionPrefix(opt.option_text)} />
                              </span>
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
                        <span className="font-bold text-[#4F7CFF] block mb-1">Giải thích:</span>
                        <FormattedText text={q.explanation} />
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

      {showSettingsModal && (
        <QuizSettingsModal 
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          onConfirm={handleStartWithConfig}
          quizTitle={result?.attempt?.quiz?.title}
          totalQuestions={result?.attempt?.quiz?.total_questions || result?.attempt?.quiz?.questions_count}
        />
      )}

      {/* Modal Thẻ Điểm / Chứng Nhận Kết Quả (Shareable Scorecard) */}
      {showScorecardModal && result && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="fixed inset-0" onClick={() => setShowScorecardModal(false)} />
          <div className="relative w-full max-w-lg bg-card border-2 border-border/80 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-6 animate-in zoom-in-95 duration-200">
            {/* Close */}
            <button 
              onClick={() => setShowScorecardModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Scorecard Visual Box */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-card via-card to-primary/5 border border-primary/20 shadow-md text-center space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
                <Sparkles className="w-3.5 h-3.5" />
                <span>CHỨNG NHẬN KẾT QUẢ ÔN THI</span>
              </div>

              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Học viên</p>
                <h3 className="text-xl font-black text-foreground mt-0.5">
                  {user?.name || "Học viên OpenQuiz"}
                </h3>
              </div>

              <div className="py-2">
                <span className="text-xs text-muted-foreground block mb-1">Môn thi / Bộ đề:</span>
                <h4 className="text-base font-bold text-primary px-3 py-1 rounded-xl bg-primary/5 border border-primary/10 inline-block max-w-full truncate">
                  {result.attempt?.quiz?.title || "Bài thi trắc nghiệm"}
                </h4>
              </div>

              {/* Giant Score Badge */}
              <div className="flex flex-col items-center justify-center my-3">
                <div className={cn(
                  "w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center shadow-lg transition-transform",
                  result.score >= 80 
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-500 shadow-emerald-500/20"
                    : result.score >= 50
                    ? "border-blue-500 bg-blue-500/10 text-blue-500 shadow-blue-500/20"
                    : "border-rose-500 bg-rose-500/10 text-rose-500 shadow-rose-500/20"
                )}>
                  <span className="text-3xl font-black tracking-tight">{result.score}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Điểm số</span>
                </div>
                <div className="mt-2 text-xs font-bold text-foreground">
                  {result.score >= 90 
                    ? "🏆 XUẤT SẮC - Sẵn sàng cho kỳ thi chính thức!"
                    : result.score >= 70
                    ? "⭐ KHÁ GIỎI - Nắm vững kiến thức trọng tâm"
                    : result.score >= 50
                    ? "👍 ĐẠT YÊU CẦU - Rèn luyện thêm để bứt phá điểm số"
                    : "💪 CẦN CỐ GẮNG - Hãy xem lại các câu sai trong Sổ tay"}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/60 text-xs">
                <div className="p-2 rounded-xl bg-card border border-border/60">
                  <span className="text-muted-foreground block text-[10px] uppercase">Chính xác</span>
                  <strong className="text-foreground text-sm font-bold">{Math.round((result.correct_answers / (result.total_questions || 1)) * 100)}%</strong>
                </div>
                <div className="p-2 rounded-xl bg-card border border-border/60">
                  <span className="text-muted-foreground block text-[10px] uppercase">Số câu đúng</span>
                  <strong className="text-emerald-500 text-sm font-bold">{result.correct_answers}/{result.total_questions}</strong>
                </div>
                <div className="p-2 rounded-xl bg-card border border-border/60">
                  <span className="text-muted-foreground block text-[10px] uppercase">Thời gian</span>
                  <strong className="text-foreground text-sm font-bold">{formatTime(result.time_taken_seconds)}</strong>
                </div>
              </div>

              <div className="text-[10px] text-muted-foreground tracking-wider uppercase pt-1">
                Xác thực bởi OpenQuiz Platform • {new Date().toLocaleDateString('vi-VN')}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleCopyLink}
                className="flex-1 py-3 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                {copied ? (
                  <><Check className="w-4 h-4 text-white" /> Đã sao chép liên kết!</>
                ) : (
                  <><Share2 className="w-4 h-4" /> Sao chép link chia sẻ</>
                )}
              </button>
              <button
                onClick={handlePrint}
                className="py-3 px-4 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" /> In thẻ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
