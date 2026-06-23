"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuizStore } from "@/store/quizStore";
import { Clock, ChevronLeft, ChevronRight, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatQuizDuration } from "@/lib/utils/time";

const cleanAnswerText = (text: string) => {
  if (!text) return '';
  return text.replace(/^[A-Z][\.\)\-]\s*/i, '').trim();
};

const QuizTimer = () => {
  const remainingTime = useQuizStore(s => s.remainingTime);
  const elapsedTime = useQuizStore(s => s.elapsedTime);

  const timeToDisplay = remainingTime !== null ? remainingTime : elapsedTime;
  const isPulse = remainingTime !== null && remainingTime > 0 && remainingTime < 300; // < 5 mins

  return (
    <div className={cn(
      "flex items-center gap-2 font-mono text-[15px] font-bold px-4 py-2 rounded-full border shadow-sm transition-all duration-300",
      isPulse 
        ? "text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/20 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.3)]" 
        : "text-slate-200 bg-[#0f172a] border-white/5"
    )}>
      <Clock className="w-4 h-4" />
      {formatQuizDuration(timeToDisplay * 1000, 'colon')}
    </div>
  );
};

const QuestionGridButton = React.memo(({ 
  idx, 
  isCurrent, 
  isAnswered, 
  isCorrect, 
  isWrong, 
  onSelect 
}: any) => {
  let gridClass = "bg-[#18233b] text-slate-400 hover:bg-[#18233b]/80 border-transparent";
  
  if (isAnswered) {
    gridClass = "bg-[#4F7CFF]/20 text-[#4F7CFF] border-[#4F7CFF]/30";
  }
  if (isCorrect) {
    gridClass = "bg-[#10B981] text-[#020617] border-[#10B981] font-bold shadow-[0_2px_8px_rgba(16,185,129,0.3)]";
  } else if (isWrong) {
    gridClass = "bg-[#EF4444] text-white border-[#EF4444] font-bold shadow-[0_2px_8px_rgba(239,68,68,0.3)]";
  }

  return (
    <button
      onClick={() => onSelect(idx)}
      className={cn(
        "h-10 rounded-[10px] font-medium text-[13px] flex items-center justify-center transition-all duration-200 hover:scale-105 border-2",
        isCurrent ? "border-white bg-[#0f172a] text-white ring-2 ring-[#4F7CFF]/50 ring-offset-2 ring-offset-[#071026] shadow-[0_4px_12px_rgba(0,0,0,0.5)]" : gridClass
      )}
    >
      {idx + 1}
    </button>
  );
});

export default function QuizPlayerPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const startQuiz = useQuizStore(s => s.startQuiz);
  const selectAnswer = useQuizStore(s => s.selectAnswer);
  const submitQuiz = useQuizStore(s => s.submitQuiz);
  const clearWrongAnswers = useQuizStore(s => s.clearWrongAnswers);
  const status = useQuizStore(s => s.status);
  const questions = useQuizStore(s => s.questions);
  const answers = useQuizStore(s => s.answers);
  const isPractice = useQuizStore(s => s.isPractice);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    const initQuiz = async () => {
      setLoading(true);
      const params = new URLSearchParams(window.location.search);
      const retryAttemptId = params.get('retry_attempt');

      try {
        if (retryAttemptId) {
          await startQuiz(Number(id), {}, Number(retryAttemptId));
        } else {
          const config = {
            mode: params.get('mode') || 'exam',
            shuffleQuestions: params.get('shuffleQ') === '1',
            shuffleOptions: params.get('shuffleO') === '1',
            autoNextDelay: Number(params.get('delay')) || 0,
            unlimitedTime: params.get('unlimited') === '1'
          };
          await startQuiz(Number(id), config.mode, config.unlimitedTime);
        }
      } catch (error: any) {
        if (error.response?.status !== 401) {
          alert('Không thể tải đề thi. Vui lòng thử lại.');
          router.push('/dashboard');
        }
      } finally {
        setLoading(false);
      }
    };
    initQuiz();
  }, [id, startQuiz, router]);

  const handleSelectOption = (optionId: number) => {
    selectAnswer(questions[currentQuestionIndex].id, optionId);
  };

  const handleSubmit = async () => {
    if (!window.confirm("Are you sure you want to submit your quiz?")) return;
    setSubmitting(true);
    try {
      const result = await submitQuiz();
      if (result) {
        router.push(`/dashboard/history/${result.id}`);
      }
    } catch (error) {
      alert("Failed to submit quiz.");
    } finally {
      setSubmitting(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progressPercentage = questions.length > 0 ? (Object.keys(answers).length / questions.length) * 100 : 0;

  if (loading || !currentQuestion) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#020617] z-50">
        <div className="w-12 h-12 border-4 border-white/10 border-t-[#4F7CFF] rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-medium">Đang tải đề thi...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-[#020617] text-slate-200 z-50 overflow-hidden font-sans">
      
      {/* Top Area */}
      <header className="h-[72px] shrink-0 bg-[#0f172a]/90 backdrop-blur-md border-b border-white/5 flex flex-col justify-center px-6 shadow-sm z-20">
        <div className="flex items-center justify-between w-full relative z-10 mb-1">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/dashboard')}
              className="p-2 -ml-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h1 className="font-bold text-[17px] text-white hidden md:block tracking-tight">Đang làm bài #{id}</h1>
          </div>
          
          <div className="flex items-center gap-5">
            <QuizTimer />
            <button 
              onClick={handleSubmit} 
              disabled={submitting} 
              className="flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-[#020617] font-bold px-5 py-2 rounded-full shadow-[0_2px_10px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
            >
              <CheckCircle2 className="w-4 h-4" /> Nộp bài
            </button>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
          <div 
            className="h-full bg-[#4F7CFF] transition-all duration-500 ease-out shadow-[0_0_10px_#4F7CFF]"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>

        {/* LEFT/CENTER: Question Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 relative z-10 scrollbar-hide">
          <div className="max-w-4xl mx-auto flex flex-col h-full">
            <div className="flex items-center justify-between text-[13px] font-semibold text-slate-400 uppercase tracking-wider mb-6">
              <span>Câu hỏi {currentQuestionIndex + 1} / {questions.length}</span>
              <span className="bg-[#18233b] px-3 py-1 rounded-full border border-white/5 text-[#4F7CFF]">1 Điểm</span>
            </div>
            
            <div className="bg-[#0f172a] rounded-[20px] border border-white/5 p-8 md:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.4)] mb-8 shrink-0">
              <h2 className="text-[24px] font-semibold leading-[1.6] text-white">
                {currentQuestion.question_text}
              </h2>
            </div>
            
            <div className="space-y-4">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = answers[currentQuestion.id] === option.id;
                const hasAnswered = !!answers[currentQuestion.id];
                const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
                
                let boxClass = "border-white/5 bg-[#0f172a] hover:border-[#4F7CFF]/50 hover:bg-[#18233b]";
                let iconClass = "bg-[#18233b] text-slate-400 group-hover:bg-[#4F7CFF]/20 group-hover:text-[#4F7CFF]";
                let textClass = "text-slate-300";

                if (isSelected) {
                  boxClass = "border-[#4F7CFF] bg-[#4F7CFF]/10 shadow-[0_4px_15px_rgba(79,124,255,0.15)]";
                  iconClass = "bg-[#4F7CFF] text-white shadow-md shadow-blue-500/30";
                  textClass = "text-white font-medium";
                }

                if (isPractice && hasAnswered) {
                  const isCorrect = option.is_correct === 1 || option.is_correct === true || String(option.is_correct) === '1' || String(option.is_correct) === 'true';
                  if (isCorrect) {
                    boxClass = "border-[#10B981] bg-[#10B981]/10 shadow-[0_4px_15px_rgba(16,185,129,0.15)]";
                    iconClass = "bg-[#10B981] text-[#020617] font-bold shadow-md shadow-emerald-500/30";
                    textClass = "text-[#10B981] font-semibold";
                  } else if (isSelected && !isCorrect) {
                    boxClass = "border-[#EF4444] bg-[#EF4444]/10 shadow-[0_4px_15px_rgba(239,68,68,0.15)]";
                    iconClass = "bg-[#EF4444] text-white font-bold shadow-md shadow-red-500/30";
                    textClass = "text-[#EF4444] font-semibold";
                  } else {
                    boxClass = "border-white/5 bg-[#071026] opacity-50 pointer-events-none";
                    iconClass = "bg-[#0f172a] text-slate-600";
                    textClass = "text-slate-500";
                  }
                }
                
                return (
                  <div 
                    key={option.id}
                    onClick={() => !hasAnswered && handleSelectOption(option.id)}
                    className={cn(
                      "flex items-center p-5 rounded-[16px] border-2 transition-all duration-200 group cursor-pointer",
                      (!isPractice || !hasAnswered) ? "active:scale-[0.99]" : "cursor-default",
                      boxClass
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center font-bold mr-5 transition-all duration-200 shrink-0",
                      iconClass
                    )}>
                      {letters[idx]}
                    </div>
                    <span className={cn("text-[16px] leading-relaxed", textClass)}>
                      {cleanAnswerText(option.option_text)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between pt-10 mt-auto gap-4">
              <button 
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-slate-300 font-semibold hover:bg-white/5 hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-5 h-5" /> Câu trước
              </button>
              <button 
                disabled={currentQuestionIndex === questions.length - 1}
                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-[#020617] font-bold hover:bg-slate-200 transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                Câu sau <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </main>

        {/* RIGHT: Question Navigator */}
        <aside className="w-full md:w-[320px] border-t md:border-t-0 md:border-l border-white/5 bg-[#071026]/80 backdrop-blur-md flex flex-col shrink-0 z-20">
          <div className="p-6 font-bold border-b border-white/5 flex items-center justify-between bg-[#0f172a]/50">
            <span className="text-white text-[15px]">Bảng câu hỏi</span>
            
            {isPractice && Object.keys(answers).length > 0 && (
              <button 
                onClick={async () => {
                  setClearing(true);
                  try {
                    await clearWrongAnswers();
                    const firstWrong = questions.findIndex(q => {
                      const ansId = answers[q.id];
                      if (!ansId) return false;
                      const opt = q.options.find(o => o.id === ansId);
                      return opt && !(opt.is_correct === 1 || opt.is_correct === true || String(opt.is_correct) === '1' || String(opt.is_correct) === 'true');
                    });
                    if (firstWrong !== -1) setCurrentQuestionIndex(firstWrong);
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setClearing(false);
                  }
                }}
                disabled={clearing}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#F59E0B]/10 text-[#F59E0B] hover:bg-[#F59E0B]/20 border border-[#F59E0B]/20 transition-colors"
              >
                {clearing ? "Đang lọc..." : "Làm lại câu sai"}
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            <div className="grid grid-cols-5 gap-3">
              {questions.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                let isCorrect = false;
                let isWrong = false;

                if (isPractice && isAnswered) {
                  const selectedOpt = q.options.find(o => o.id === answers[q.id]);
                  const isOptCorrect = selectedOpt && (selectedOpt.is_correct === 1 || selectedOpt.is_correct === true || String(selectedOpt.is_correct) === '1' || String(selectedOpt.is_correct) === 'true');
                  
                  if (isOptCorrect) isCorrect = true;
                  else isWrong = true;
                }

                return (
                  <QuestionGridButton
                    key={q.id}
                    idx={idx}
                    isCurrent={currentQuestionIndex === idx}
                    isAnswered={isAnswered}
                    isCorrect={isCorrect}
                    isWrong={isWrong}
                    onSelect={setCurrentQuestionIndex}
                  />
                );
              })}
            </div>
          </div>
          
          {/* Navigator Footer Stats */}
          <div className="p-6 border-t border-white/5 bg-[#0f172a]/80 grid grid-cols-2 gap-4 text-sm font-medium">
            <div className="flex flex-col gap-1">
              <span className="text-slate-500 text-[11px] uppercase tracking-wider">Đã làm</span>
              <span className="text-white text-lg">{Object.keys(answers).length}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-slate-500 text-[11px] uppercase tracking-wider">Còn lại</span>
              <span className="text-white text-lg">{questions.length - Object.keys(answers).length}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
