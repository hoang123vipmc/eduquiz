"use client";

import React, { useEffect, useState, useMemo } from "react";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import { 
  History, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  ChevronLeft, 
  Search, 
  Filter, 
  RotateCcw, 
  Trophy, 
  Target, 
  Clock, 
  Award,
  BookOpen
} from "lucide-react";
import { formatQuizDuration } from "@/lib/utils/time";
import { cn } from "@/lib/utils";

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "passed" | "failed">("all");
  const [sortBy, setSortBy] = useState<"newest" | "highest" | "lowest">("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const router = useRouter();

  // 1. Khôi phục tức thì từ bộ nhớ đệm (0ms Perceived Load)
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem('openquiz_cached_history');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed.history) && parsed.history.length > 0) {
          setHistory(parsed.history);
          setTotalPages(parsed.totalPages || 1);
          setTotalCount(parsed.totalCount || parsed.history.length);
          setLoading(false);
        }
      }
    } catch {}
  }, []);

  const fetchHistory = async () => {
    const isDefault = page === 1 && !search && statusFilter === 'all';
    const hasCached = !!sessionStorage.getItem('openquiz_cached_history');
    if (!hasCached || !isDefault) {
      setLoading(true);
    }
    try {
      const params = new URLSearchParams({
        page: String(page),
        search: search,
        status: statusFilter,
        per_page: "12"
      });
      const { data } = await api.get(`/user/history?${params.toString()}`);
      if (data.success) {
        const historyItems = data.data || [];
        setHistory(historyItems);
        const lastPage = data.pagination?.last_page || 1;
        const total = data.pagination?.total || historyItems.length;
        setTotalPages(lastPage);
        setTotalCount(total);
        if (isDefault) {
          try {
            sessionStorage.setItem('openquiz_cached_history', JSON.stringify({
              history: historyItems,
              totalPages: lastPage,
              totalCount: total
            }));
          } catch {}
        }
      }
    } catch (error) {
      console.error("Lỗi tải lịch sử", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchHistory();
    }, 350);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  useEffect(() => {
    fetchHistory();
  }, [page]);

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', { 
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit' 
    }).format(d);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 70) return "text-primary bg-primary/10 border-primary/20";
    if (score >= 50) return "text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/20";
    return "text-rose-700 dark:text-rose-400 bg-rose-500/10 border-rose-500/20";
  };

  // Client-side sort on current view
  const sortedHistory = useMemo(() => {
    const list = [...history];
    if (sortBy === "highest") {
      return list.sort((a, b) => (b.score || 0) - (a.score || 0));
    }
    if (sortBy === "lowest") {
      return list.sort((a, b) => (a.score || 0) - (b.score || 0));
    }
    return list; // default server newest
  }, [history, sortBy]);

  // Overall calculations from current dataset
  const maxScore = useMemo(() => {
    if (history.length === 0) return 0;
    return Math.max(...history.map(h => h.score || 0));
  }, [history]);

  const passCount = useMemo(() => {
    return history.filter(h => (h.score || 0) >= 50).length;
  }, [history]);

  const passRate = useMemo(() => {
    if (history.length === 0) return 0;
    return Math.round((passCount / history.length) * 100);
  }, [history, passCount]);

  return (
    <div className="space-y-7 animate-in fade-in duration-300 pb-12">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-xs shrink-0">
            <History className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Lịch sử làm bài
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                {totalCount} lượt thi
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Theo dõi chi tiết các lượt thi, điểm số và xem lại từng bài làm đã nộp.
            </p>
          </div>
        </div>

        <button 
          onClick={() => router.push('/dashboard/quizzes')}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-xs hover:shadow-md shrink-0"
        >
          <BookOpen className="w-4 h-4" /> Làm đề thi mới
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="col-span-2 sm:col-span-1 p-3.5 sm:p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-500/10 text-primary flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] sm:text-xs font-medium text-muted-foreground">Tổng số lượt làm bài</p>
            <p className="text-lg sm:text-xl font-bold text-foreground mt-0.5">{totalCount} bài</p>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] sm:text-xs font-medium text-muted-foreground">Điểm cao nhất</p>
            <p className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {maxScore > 0 ? `${maxScore}đ` : "—"}
            </p>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] sm:text-xs font-medium text-muted-foreground">Tỷ lệ đạt</p>
            <p className="text-lg sm:text-xl font-bold text-foreground mt-0.5">
              {history.length > 0 ? `${passRate}%` : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên đề thi..."
            className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between sm:justify-start">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60 text-xs font-semibold overflow-x-auto max-w-full">
            <button
              onClick={() => setStatusFilter("all")}
              className={cn(
                "px-2.5 sm:px-3 py-1.5 rounded-lg transition-all whitespace-nowrap",
                statusFilter === "all" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Tất cả
            </button>
            <button
              onClick={() => setStatusFilter("passed")}
              className={cn(
                "px-2.5 sm:px-3 py-1.5 rounded-lg transition-all whitespace-nowrap",
                statusFilter === "passed" ? "bg-card text-emerald-700 dark:text-emerald-400 shadow-xs" : "text-muted-foreground hover:text-emerald-600"
              )}
            >
              Đạt (≥ 50)
            </button>
            <button
              onClick={() => setStatusFilter("failed")}
              className={cn(
                "px-2.5 sm:px-3 py-1.5 rounded-lg transition-all whitespace-nowrap",
                statusFilter === "failed" ? "bg-card text-rose-700 dark:text-rose-400 shadow-xs" : "text-muted-foreground hover:text-rose-600"
              )}
            >
              Chưa đạt
            </button>
          </div>

          {/* Sort Selector */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              aria-label="Sắp xếp lịch sử làm bài"
              className="bg-card border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer appearance-none pr-7"
            >
              <option value="newest">Mới nhất</option>
              <option value="highest">Điểm cao</option>
              <option value="lowest">Điểm thấp</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="space-y-3">
          <div className="h-12 bg-muted/60 rounded-xl animate-pulse border border-border"></div>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 bg-card rounded-xl animate-pulse border border-border"></div>
          ))}
        </div>
      ) : sortedHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-card rounded-2xl border border-border shadow-xs">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <History className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Không tìm thấy lượt làm bài nào</h3>
          <p className="text-muted-foreground max-w-sm mb-6 text-sm">
            {search || statusFilter !== "all" 
              ? "Không có bài thi nào khớp với bộ lọc hiện tại. Hãy thử chọn điều kiện lọc khác."
              : "Bạn chưa hoàn thành bài thi nào. Hãy bắt đầu làm bài để ghi nhận lịch sử học tập!"}
          </p>
          <button 
            onClick={() => router.push('/dashboard/quizzes')}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-xs"
          >
            Khám phá đề thi ngay
          </button>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
          {/* MOBILE CARDS VIEW (< md) */}
          <div className="md:hidden divide-y divide-border">
            {sortedHistory.map((h) => {
              const scoreColor = getScoreColor(h.score);
              const isPass = (h.score || 0) >= 50;
              const quizId = h.quiz?.id || h.attempt?.quiz_id;

              return (
                <div 
                  key={h.id}
                  onClick={() => router.push(`/result/${h.id || h.attempt_id}`)}
                  className="p-4 hover:bg-muted/30 transition-colors cursor-pointer active:bg-muted/50 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-foreground line-clamp-2 leading-snug">
                        {h.quiz?.title || "Đề thi đã bị xóa"}
                      </h4>
                      {h.quiz?.category?.name && (
                        <span className="inline-block text-[11px] font-medium text-muted-foreground mt-0.5">
                          {h.quiz.category.name}
                        </span>
                      )}
                    </div>
                    <span className={cn("px-2.5 py-1 rounded-lg border font-bold text-xs shrink-0 shadow-2xs", scoreColor)}>
                      {h.score} điểm
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        {isPass ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        )}
                        <span>{h.correct_answers}/{h.total_questions || (h.correct_answers + (h.wrong_answers || 0) + (h.skipped_answers || 0))}</span>
                      </span>

                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatQuizDuration((h.time_taken_seconds || 0) * 1000, 'text')}
                      </span>
                    </div>

                    <span className="text-[11px] text-muted-foreground/80">
                      {formatDate(h.created_at)}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/40" onClick={(e) => e.stopPropagation()}>
                    {quizId && (
                      <button
                        onClick={() => {
                          const mode = h.attempt?.mode || 'practice';
                          const query = new URLSearchParams({
                            mode: mode,
                            unlimited: mode === 'practice' ? '1' : '0',
                            fresh: '1'
                          }).toString();
                          router.push(`/play/${quizId}?${query}`);
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 flex items-center gap-1 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Làm lại</span>
                      </button>
                    )}
                    <button
                      onClick={() => router.push(`/result/${h.id || h.attempt_id}`)}
                      className="px-3 py-1 rounded-lg bg-muted text-foreground text-xs font-semibold hover:bg-muted/80 flex items-center gap-1 transition-colors"
                    >
                      <span>Xem kết quả</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP TABLE VIEW (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-muted/50 text-muted-foreground font-semibold text-xs uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="px-5 py-4">Tên đề thi</th>
                  <th className="px-5 py-4">Thời gian nộp</th>
                  <th className="px-5 py-4">Điểm số</th>
                  <th className="px-5 py-4">Số câu đúng</th>
                  <th className="px-5 py-4">Thời lượng</th>
                  <th className="px-5 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedHistory.map((h) => {
                  const scoreColor = getScoreColor(h.score);
                  const isPass = (h.score || 0) >= 50;
                  const quizId = h.quiz?.id || h.attempt?.quiz_id;

                  return (
                    <tr 
                      key={h.id} 
                      onClick={() => router.push(`/result/${h.id || h.attempt_id}`)}
                      className="hover:bg-muted/30 transition-colors group cursor-pointer"
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-foreground max-w-[280px] truncate group-hover:text-primary transition-colors" title={h.quiz?.title}>
                          {h.quiz?.title || "Đề thi đã bị xóa"}
                        </div>
                        {h.quiz?.category?.name && (
                          <span className="text-xs text-muted-foreground mt-0.5 inline-block">
                            {h.quiz.category.name}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground text-xs">
                        {formatDate(h.created_at)}
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn("px-2.5 py-1 rounded-lg border font-bold text-xs", scoreColor)}>
                          {h.score} điểm
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {isPass ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                          )}
                          <span className="text-foreground font-medium text-xs">
                            {h.correct_answers} <span className="text-muted-foreground">/ {h.total_questions || (h.correct_answers + (h.wrong_answers || 0) + (h.skipped_answers || 0))}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground text-xs">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatQuizDuration((h.time_taken_seconds || 0) * 1000, 'text')}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {quizId && (
                            <button
                              onClick={() => {
                                const mode = h.attempt?.mode || 'practice';
                                const query = new URLSearchParams({
                                  mode: mode,
                                  unlimited: mode === 'practice' ? '1' : '0',
                                  fresh: '1'
                                }).toString();
                                router.push(`/play/${quizId}?${query}`);
                              }}
                              title={h.attempt?.mode === 'practice' ? "Ôn tập lại đề thi này" : "Thi lại đề thi này"}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => router.push(`/result/${h.id || h.attempt_id}`)}
                            title="Xem chi tiết kết quả"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground font-medium text-xs transition-colors"
                          >
                            Xem <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-border flex items-center justify-between bg-muted/20">
              <p className="text-xs text-muted-foreground">
                Trang <span className="font-semibold text-foreground">{page}</span> / {totalPages} ({totalCount} lượt thi)
              </p>
              <div className="flex gap-1.5">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  className="px-3 py-1.5 flex items-center gap-1 rounded-lg border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-semibold shadow-xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Trước
                </button>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                  className="px-3 py-1.5 flex items-center gap-1 rounded-lg border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-semibold shadow-xs"
                >
                  Sau <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
