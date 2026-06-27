"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import { Clock, HelpCircle, CheckCircle2, FileUp, Trash2, Users } from "lucide-react";

import { QuizSettingsModal } from "@/components/quiz/QuizSettingsModal";
import { ImportQuizModal } from "@/components/quiz/ImportQuizModal";
import { cn } from "@/lib/utils";

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/quizzes");
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
    fetchQuizzes();
  }, []);

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
          className="flex items-center gap-2 bg-[#4F7CFF] hover:bg-[#6D91FF] text-foreground px-6 py-3 rounded-xl font-semibold shadow-[0_4px_12px_rgba(79,124,255,0.3)] transition-all hover:shadow-[0_6px_16px_rgba(79,124,255,0.4)] hover:-translate-y-0.5 active:translate-y-0"
        >
          <FileUp className="w-4 h-4" /> Import Đề thi
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="animate-pulse flex flex-col bg-card rounded-[20px] overflow-hidden border border-border h-[340px]">
              <div className="h-32 bg-muted"></div>
              <div className="p-6 flex-1 flex flex-col gap-4">
                <div className="h-6 bg-muted rounded-md w-3/4"></div>
                <div className="h-4 bg-muted rounded-md w-full"></div>
                <div className="h-4 bg-muted rounded-md w-2/3"></div>
                <div className="mt-auto h-12 bg-muted rounded-xl w-full"></div>
              </div>
            </div>
          ))}
        </div>
      ) : quizzes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-card rounded-[20px] border border-border">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
            <FileUp className="w-10 h-10 text-[#4F7CFF]" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-3">Chưa có đề thi nào</h3>
          <p className="text-muted-foreground max-w-sm mb-8">
            Bạn chưa có đề thi nào. Hãy tải lên một file Word hoặc tạo thủ công để bắt đầu.
          </p>
          <button 
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 bg-[#4F7CFF] hover:bg-[#6D91FF] text-foreground px-6 py-3 rounded-xl font-semibold shadow-[0_4px_12px_rgba(79,124,255,0.3)] transition-all hover:shadow-[0_6px_16px_rgba(79,124,255,0.4)]"
          >
            Tạo đề thi đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="group flex flex-col bg-card rounded-[20px] overflow-hidden border border-border hover:border-border hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all duration-300">
              
              {/* TOP: Banner */}
              <div className="h-32 relative bg-gradient-to-br from-[#1e293b] to-[#0f172a] flex items-end p-4 border-b border-border">
                {/* Abstract shape */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                
                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-foreground bg-blue-500/80 backdrop-blur-md rounded-md">
                    {quiz.category?.name || 'Tự do'}
                  </span>
                  <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 backdrop-blur-md rounded-md">
                    Cơ bản
                  </span>
                </div>

                <button 
                  onClick={(e) => handleDeleteQuiz(e, quiz.id, quiz.title)}
                  className="absolute top-4 right-4 z-20 p-2 bg-[#EF4444]/20 text-red-200 hover:bg-[#EF4444] hover:text-foreground rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
                  title="Xóa đề thi"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* MIDDLE: Content */}
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-foreground line-clamp-1 mb-2 group-hover:text-[#4F7CFF] transition-colors" title={quiz.title}>
                  {quiz.title}
                </h3>
                <p className="text-[14px] text-muted-foreground line-clamp-2 mb-6 flex-1 leading-relaxed">
                  {quiz.description || "Chưa có mô tả cho đề thi này."}
                </p>

                {/* BOTTOM: Stats */}
                <div className="flex items-center justify-between text-[13px] text-muted-foreground font-medium mb-6">
                  <div className="flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-[#4F7CFF]" /> {quiz.total_questions} câu
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#F59E0B]" /> {quiz.duration_minutes} phút
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#10B981]" /> 1.2k+
                  </div>
                </div>

                <button 
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#4F7CFF] to-blue-600 hover:from-[#6D91FF] hover:to-blue-500 text-foreground font-semibold py-3.5 rounded-xl transition-all duration-300 hover:scale-[1.03] shadow-[0_4px_12px_rgba(79,124,255,0.2)] hover:shadow-[0_8px_20px_rgba(79,124,255,0.4)]" 
                  onClick={() => setSelectedQuiz(quiz)}
                >
                  Bắt đầu làm <ChevronRightIcon />
                </button>
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
