"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import { Clock, HelpCircle, CheckCircle2, FileUp, Trash2, Users, Search } from "lucide-react";

import { QuizSettingsModal } from "@/components/quiz/QuizSettingsModal";
import { ImportQuizModal } from "@/components/quiz/ImportQuizModal";
import { cn } from "@/lib/utils";

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('search') || '';
    if (q) {
      setSearch(q);
      setDebouncedSearch(q);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchQuizzes = async (query = debouncedSearch) => {
    setLoading(true);
    try {
      const url = query ? `/quizzes?search=${encodeURIComponent(query)}` : '/quizzes';
      const { data } = await api.get(url);
      if (data.success) {
        const quizzesList = Array.isArray(data.data) ? data.data : data.data.data;
        setQuizzes(quizzesList || []);
      }
    } catch (error) {
      console.error("Lỗi tải danh sách đề thi", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes(debouncedSearch);
  }, [debouncedSearch]);

  const handleStartQuiz = (config: any) => {
    if (!selectedQuiz) return;
    const query = new URLSearchParams({
      mode: config.examMode,
      shuffleQ: config.shuffleQuestions ? '1' : '0',
      shuffleO: config.shuffleOptions ? '1' : '0',
      delay: config.autoNextDelay,
      unlimited: config.unlimitedTime ? '1' : '0'
    }).toString();
    
    router.push(`/play/${selectedQuiz.id}?${query}`);
    setSelectedQuiz(null);
  };

  const handleDeleteQuiz = async (e: React.MouseEvent, id: number, title: string) => {
    e.stopPropagation();
    if (window.confirm(`Bạn có chắc chắn muốn xóa đề thi "${title}"?`)) {
      try {
        const { data } = await api.delete(`/quizzes/${id}`);
        if (data.success) {
          fetchQuizzes();
        }
      } catch (error) {
        console.error("Lỗi khi xoá đề thi", error);
        alert("Xóa thất bại, vui lòng thử lại.");
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-2">Đề thi của tôi</h2>
          <p className="text-muted-foreground text-[15px]">
            Khám phá và luyện tập với ngân hàng đề thi của bạn.
          </p>
        </div>
        <button 
          onClick={() => setShowImportModal(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md font-medium transition-colors shrink-0"
        >
          <FileUp className="w-4 h-4" /> Import Đề thi
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card border border-border p-4 rounded-lg shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Tìm kiếm theo tên đề thi"
            placeholder="Tìm kiếm theo tên đề thi..."
            className="w-full bg-background border border-input rounded-md pl-9 pr-8 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
          />
          {search && (
            <button 
              onClick={() => setSearch("")}
              aria-label="Xóa từ khóa tìm kiếm"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs p-1"
            >
              ✕
            </button>
          )}
        </div>
        <div className="text-xs font-semibold text-muted-foreground self-start sm:self-auto">
          {loading ? "Đang tìm kiếm..." : `Tìm thấy ${quizzes.length} đề thi`}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="animate-pulse flex flex-col bg-card rounded-lg overflow-hidden border border-border h-[200px]">
              <div className="p-6 flex-1 flex flex-col gap-4">
                <div className="h-6 bg-muted rounded-md w-3/4"></div>
                <div className="h-4 bg-muted rounded-md w-full"></div>
                <div className="h-4 bg-muted rounded-md w-2/3"></div>
                <div className="mt-auto h-10 bg-muted rounded-md w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : quizzes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-card rounded-lg border border-border">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
            <FileUp className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Chưa có đề thi nào</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            Bạn chưa có đề thi nào. Hãy tải lên một file Word hoặc tạo thủ công để bắt đầu.
          </p>
          <button 
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md font-medium transition-colors"
          >
            Tạo đề thi đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="group flex flex-col bg-card rounded-lg border border-border hover:border-border/80 hover:bg-accent transition-colors">
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h3 className="text-base font-semibold text-foreground line-clamp-1 flex-1 group-hover:text-primary transition-colors" title={quiz.title}>
                    {quiz.title}
                  </h3>
                  <button 
                    onClick={(e) => handleDeleteQuiz(e, quiz.id, quiz.title)}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                    aria-label={`Xóa đề thi ${quiz.title}`}
                    title="Xóa đề thi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex gap-2 mb-3">
                  <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 rounded">
                    {quiz.category?.name || 'Tự do'}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted rounded">
                    Cơ bản
                  </span>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2 mb-6 flex-1">
                  {quiz.description || "Chưa có mô tả cho đề thi này."}
                </p>

                {/* BOTTOM: Stats & Action */}
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5" /> {quiz.total_questions}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> {quiz.duration_minutes}m
                    </div>
                  </div>
                  
                  <button 
                    className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                    onClick={() => setSelectedQuiz(quiz)}
                  >
                    Bắt đầu <ChevronRightIcon />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Render Modal */}
      <QuizSettingsModal 
        isOpen={!!selectedQuiz}
        onClose={() => setSelectedQuiz(null)}
        quizTitle={selectedQuiz?.title}
        onConfirm={handleStartQuiz}
      />

      <ImportQuizModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => {
          setShowImportModal(false);
          fetchQuizzes();
        }}
      />
    </div>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
