"use client";

import React, { useEffect, useState } from "react";
import { FileQuestion, Search, Filter, Loader2, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";

interface Question {
  id: number;
  question_text: string;
  type: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  quiz?: {
    id: number;
    title: string;
  };
}

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/bank/questions?page=${page}&search=${search}&difficulty=${difficulty}`);
      if (data.success) {
        setQuestions(data.data.data);
        setTotalPages(data.data.last_page);
        setTotalItems(data.data.total);
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search
    const delayDebounceFn = setTimeout(() => {
      setPage(1); // Reset to page 1 on new search/filter
      fetchQuestions();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search, difficulty]);

  useEffect(() => {
    fetchQuestions();
  }, [page]);

  const getDifficultyColor = (diff: string) => {
    switch(diff) {
      case 'easy': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'medium': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'hard': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <FileQuestion className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ngân hàng câu hỏi</h1>
            <p className="text-muted-foreground text-sm">Quản lý toàn bộ {totalItems} câu hỏi từ các bộ đề của bạn</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Tìm kiếm câu hỏi..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors w-full sm:w-[250px]"
            />
          </div>

          {/* Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="pl-9 pr-8 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
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
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="p-4 text-sm font-semibold text-foreground w-[50%]">Câu hỏi</th>
                <th className="p-4 text-sm font-semibold text-foreground w-[25%]">Thuộc bộ đề</th>
                <th className="p-4 text-sm font-semibold text-foreground w-[15%]">Độ khó</th>
                <th className="p-4 text-sm font-semibold text-foreground w-[10%] text-right">Điểm</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                  </td>
                </tr>
              ) : questions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center">
                    <FileQuestion className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">Không tìm thấy câu hỏi nào</p>
                  </td>
                </tr>
              ) : (
                questions.map((q) => (
                  <tr key={q.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <p className="text-sm font-medium text-foreground line-clamp-2" title={q.question_text}>
                        {q.question_text}
                      </p>
                    </td>
                    <td className="p-4">
                      {q.quiz ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <BookOpen className="w-4 h-4 shrink-0" />
                          <span className="truncate max-w-[200px]" title={q.quiz.title}>{q.quiz.title}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={cn("px-2.5 py-1 rounded-md text-xs font-medium border", getDifficultyColor(q.difficulty))}>
                        {getDifficultyLabel(q.difficulty)}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-sm font-bold text-foreground">{q.points}</span>
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
            <p className="text-sm text-muted-foreground">
              Trang <span className="font-medium text-foreground">{page}</span> / {totalPages}
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="p-2 rounded-lg border border-border bg-background text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="p-2 rounded-lg border border-border bg-background text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
