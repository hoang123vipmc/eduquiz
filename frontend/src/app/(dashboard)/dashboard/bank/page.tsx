"use client";

import React, { useEffect, useState } from "react";
import { 
  FileQuestion, 
  Search, 
  Filter, 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Eye, 
  Trash2, 
  X, 
  CheckCircle2, 
  HelpCircle,
  Sparkles,
  Layers
} from "lucide-react";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { FormattedText, cleanInlineText, cleanOptionPrefix } from "@/components/quiz/FormattedText";

interface Option {
  id: number;
  option_text: string;
  is_correct?: boolean;
}

interface Question {
  id: number;
  question_text: string;
  question_image?: string | null;
  explanation?: string | null;
  type: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  quiz?: {
    id: number;
    title: string;
  };
  options?: Option[];
}

export default function QuestionBankPage() {
  const { user } = useAuthStore();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [selectedQuizId, setSelectedQuizId] = useState("");
  const [userQuizzes, setUserQuizzes] = useState<{ id: number; title: string }[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        search: search,
        difficulty: difficulty,
        ...(selectedQuizId ? { quiz_id: selectedQuizId } : {})
      });
      const { data } = await api.get(`/bank/questions?${params.toString()}`);
      if (data.success) {
        setQuestions(data.data.data);
        setTotalPages(data.data.last_page);
        setTotalItems(data.data.total);
        if (data.data.user_quizzes) {
          setUserQuizzes(data.data.user_quizzes);
        }
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1);
      fetchQuestions();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [search, difficulty, selectedQuizId]);

  useEffect(() => {
    fetchQuestions();
  }, [page]);

  const handleDeleteQuestion = async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Bạn có chắc chắn muốn xóa câu hỏi này khỏi đề thi?")) return;
    
    setDeletingId(id);
    try {
      const { data } = await api.delete(`/questions/${id}`);
      if (data.success) {
        if (activeQuestion?.id === id) {
          setActiveQuestion(null);
        }
        fetchQuestions();
      }
    } catch (error) {
      alert("Không thể xóa câu hỏi. Vui lòng thử lại.");
    } finally {
      setDeletingId(null);
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch(diff) {
      case 'easy': return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20';
      case 'medium': return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20';
      case 'hard': return 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getDifficultyLabel = (diff: string) => {
    switch(diff) {
      case 'easy': return 'Dễ';
      case 'medium': return 'Trung bình';
      case 'hard': return 'Khó';
      default: return diff;
    }
  };

  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-border/40">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-xs">
            <FileQuestion className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Ngân hàng câu hỏi
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                {totalItems} câu hỏi
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Tra cứu, kiểm tra đáp án chi tiết và quản lý toàn bộ câu hỏi từ các bộ đề của bạn.
            </p>
          </div>
        </div>

        {/* Filter toolbar */}
        <div className="flex flex-col sm:flex-row gap-2.5 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input 
              type="text" 
              placeholder="Tìm kiếm nội dung câu hỏi..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Tìm kiếm câu hỏi"
              className="pl-9 pr-4 py-2 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-full sm:w-[220px]"
            />
          </div>

          {/* Filter by Quiz */}
          {userQuizzes.length > 0 && (
            <div className="relative">
              <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <select
                value={selectedQuizId}
                onChange={(e) => setSelectedQuizId(e.target.value)}
                aria-label="Lọc theo bộ đề"
                className="pl-9 pr-8 py-2 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer max-w-[200px] truncate"
              >
                <option value="">Tất cả bộ đề</option>
                {userQuizzes.map((quiz) => (
                  <option key={quiz.id} value={quiz.id}>
                    {quiz.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filter by Difficulty */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              aria-label="Lọc theo độ khó"
              className="pl-9 pr-8 py-2 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer"
            >
              <option value="">Tất cả độ khó</option>
              <option value="easy">Dễ</option>
              <option value="medium">Trung bình</option>
              <option value="hard">Khó</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {/* Table & Mobile Cards */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
        {/* MOBILE CARDS VIEW (< md) */}
        <div className="md:hidden divide-y divide-border">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-7 h-7 animate-spin text-primary mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Đang tải câu hỏi...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="p-8 text-center">
              <FileQuestion className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-foreground font-semibold text-sm">Không tìm thấy câu hỏi</p>
              <p className="text-muted-foreground text-xs mt-1">Hãy thử xóa bộ lọc hoặc tìm kiếm bằng từ khóa khác</p>
            </div>
          ) : (
            questions.map((q) => (
              <div
                key={q.id}
                onClick={() => setActiveQuestion(q)}
                className="p-4 hover:bg-muted/40 active:bg-muted/60 transition-colors cursor-pointer space-y-2.5"
              >
                <p className="text-sm font-medium text-foreground line-clamp-3 leading-relaxed">
                  <FormattedText text={q.question_text} />
                </p>

                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md font-semibold text-[11px] border", getDifficultyColor(q.difficulty))}>
                    {getDifficultyLabel(q.difficulty)}
                  </span>

                  <span className="text-[11px] font-semibold text-foreground/80 bg-muted px-2 py-0.5 rounded-md border border-border/60">
                    {q.points || 1} điểm
                  </span>

                  {q.quiz && (
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground truncate max-w-[170px]" title={q.quiz.title}>
                      <BookOpen className="w-3 h-3 text-primary/70 shrink-0" />
                      <span className="truncate">{q.quiz.title}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1.5 border-t border-border/40" onClick={(e) => e.stopPropagation()}>
                  <span className="text-[11px] text-muted-foreground">
                    {q.options?.length ? `${q.options.length} lựa chọn` : 'Câu hỏi'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setActiveQuestion(q)}
                      className="px-2.5 py-1 rounded-lg bg-muted text-foreground hover:bg-muted/80 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-primary" />
                      <span>Xem đáp án</span>
                    </button>
                    {(user?.role === 'admin' || (user?.id && (!q.quiz || (q.quiz as any).user_id === user.id))) && (
                      <button
                        onClick={(e) => handleDeleteQuestion(q.id, e)}
                        disabled={deletingId === q.id}
                        aria-label="Xóa câu hỏi"
                        className="p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {deletingId === q.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* DESKTOP TABLE VIEW (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground w-[48%]">Nội dung câu hỏi</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground w-[22%]">Thuộc bộ đề</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground w-[12%]">Độ khó</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground w-[8%] text-center">Điểm</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground w-[10%] text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <Loader2 className="w-7 h-7 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Đang tải câu hỏi...</p>
                  </td>
                </tr>
              ) : questions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <FileQuestion className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-foreground font-semibold text-sm">Không tìm thấy câu hỏi phù hợp</p>
                    <p className="text-muted-foreground text-xs mt-1">Hãy thử xóa bộ lọc hoặc tìm kiếm bằng từ khóa khác</p>
                  </td>
                </tr>
              ) : (
                questions.map((q) => (
                  <tr 
                    key={q.id} 
                    onClick={() => setActiveQuestion(q)}
                    className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors cursor-pointer group"
                  >
                    <td className="p-4">
                      <p className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors" title={cleanInlineText(q.question_text)}>
                        <FormattedText text={q.question_text} />
                      </p>
                    </td>
                    <td className="p-4">
                      {q.quiz ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <BookOpen className="w-3.5 h-3.5 shrink-0 text-primary/70" />
                          <span className="truncate max-w-[180px]" title={q.quiz.title}>{q.quiz.title}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border", getDifficultyColor(q.difficulty))}>
                        {getDifficultyLabel(q.difficulty)}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-sm font-semibold text-foreground">{q.points || 1}</span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setActiveQuestion(q)}
                          aria-label="Xem chi tiết câu hỏi"
                          title="Xem đáp án & giải thích"
                          className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {(user?.role === 'admin' || (user?.id && (!q.quiz || (q.quiz as any).user_id === user.id))) && (
                          <button
                            onClick={(e) => handleDeleteQuestion(q.id, e)}
                            disabled={deletingId === q.id}
                            aria-label="Xóa câu hỏi"
                            title="Xóa câu hỏi này"
                            className="p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {deletingId === q.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between bg-muted/20">
            <p className="text-xs text-muted-foreground">
              Trang <span className="font-semibold text-foreground">{page}</span> / {totalPages} ({totalItems} câu)
            </p>
            <div className="flex gap-1.5">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                aria-label="Trang trước"
                className="px-3 py-1.5 flex items-center gap-1 rounded-lg border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-semibold shadow-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Trước
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                aria-label="Trang tiếp theo"
                className="px-3 py-1.5 flex items-center gap-1 rounded-lg border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-semibold shadow-xs"
              >
                Sau <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Question Detail Modal */}
      {activeQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="w-full max-w-2xl bg-card rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold border", getDifficultyColor(activeQuestion.difficulty))}>
                  Độ khó: {getDifficultyLabel(activeQuestion.difficulty)}
                </span>
                {activeQuestion.quiz && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1 truncate max-w-[200px]">
                    • <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" /> <span className="truncate">{activeQuestion.quiz.title}</span>
                  </span>
                )}
              </div>
              <button 
                onClick={() => setActiveQuestion(null)}
                aria-label="Đóng chi tiết"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6">
              {/* Question Text */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Câu hỏi:</p>
                <div className="p-4 rounded-xl bg-muted/50 border border-border text-foreground font-semibold text-base leading-relaxed">
                  <FormattedText text={activeQuestion.question_text} />
                </div>
              </div>

              {/* Options */}
              {activeQuestion.options && activeQuestion.options.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    Các lựa chọn ({activeQuestion.options.length}):
                  </p>
                  <div className="space-y-2.5">
                    {activeQuestion.options.map((opt, idx) => {
                      const isCorrect = opt.is_correct === true || (opt as any).is_correct === 1 || String((opt as any).is_correct) === '1';
                      return (
                        <div 
                          key={opt.id || idx}
                          className={cn(
                            "flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all",
                            isCorrect 
                              ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 shadow-xs" 
                              : "bg-card border-border text-foreground"
                          )}
                        >
                          <div className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5",
                            isCorrect 
                              ? "bg-emerald-500 text-white shadow-xs" 
                              : "bg-muted text-muted-foreground"
                          )}>
                            {letters[idx] || idx + 1}
                          </div>
                          <div className="flex-1 text-sm leading-relaxed pt-0.5">
                            <FormattedText text={cleanOptionPrefix(opt.option_text)} />
                          </div>
                          {isCorrect && (
                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-md shrink-0">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Đáp án đúng
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Explanation */}
              {activeQuestion.explanation && (
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-1">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" /> Lời giải / Giải thích:
                  </div>
                  <div className="text-sm text-foreground/90 leading-relaxed pt-1">
                    <FormattedText text={activeQuestion.explanation} />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-border bg-muted/20">
              <button
                onClick={() => handleDeleteQuestion(activeQuestion.id)}
                disabled={deletingId === activeQuestion.id}
                className="flex items-center gap-1.5 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {deletingId === activeQuestion.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>Xóa câu hỏi này</span>
              </button>

              <button
                onClick={() => setActiveQuestion(null)}
                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all shadow-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
