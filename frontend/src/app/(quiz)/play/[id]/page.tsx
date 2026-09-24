"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuizStore } from "@/store/quizStore";
import { Clock, ChevronLeft, ChevronRight, CheckCircle2, X, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatQuizDuration } from "@/lib/utils/time";

const cleanAnswerText = (text: string) => {
  if (!text) return '';
  return text.replace(/^(\*?\s*[A-F1-6]\s*[\.\)\-]\s*)+/i, '').trim();
};

const QuizTimer = () => {
  const remainingTime = useQuizStore(s => s.remainingTime);
  const elapsedTime = useQuizStore(s => s.elapsedTime);

  const timeToDisplay = remainingTime !== null ? remainingTime : elapsedTime;
  const isPulse = remainingTime !== null && remainingTime > 0 && remainingTime <= 60; // < 1 min pulse
  const isWarning = remainingTime !== null && remainingTime > 60 && remainingTime < 300; // < 5 mins amber

  return (
    <div className={cn(
      "flex items-center gap-2 font-mono text-[14px] md:text-[15px] font-bold px-3.5 py-1.5 md:px-4 md:py-2 rounded-full border shadow-xs transition-all duration-300",
      isPulse 
        ? "text-rose-600 dark:text-rose-400 bg-rose-500/15 border-rose-500/30 animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.3)]" 
        : isWarning
        ? "text-amber-700 dark:text-amber-400 bg-amber-500/15 border-amber-500/30"
        : "text-foreground bg-card border-border"
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
  let gridClass = "bg-muted text-muted-foreground hover:bg-muted/80 border-transparent";
  
  if (isAnswered) {
    gridClass = "bg-primary/15 text-primary border-primary/30";
  }
  if (isCorrect) {
    gridClass = "bg-emerald-500 text-white border-emerald-500 font-bold shadow-[0_2px_8px_rgba(16,185,129,0.3)]";
  } else if (isWrong) {
    gridClass = "bg-rose-500 text-white border-rose-500 font-bold shadow-[0_2px_8px_rgba(239,68,68,0.3)]";
  }

  return (
    <button
      onClick={() => onSelect(idx)}
      aria-label={`Câu hỏi ${idx + 1}`}
      className={cn(
        "min-h-[44px] rounded-xl font-semibold text-[13px] flex items-center justify-center transition-all duration-150 hover:scale-105 border-2 focus-visible:ring-2 focus-visible:ring-primary",
        isCurrent ? "border-primary bg-card text-foreground ring-2 ring-primary/40 ring-offset-2 ring-offset-background shadow-md" : gridClass
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
  const retryWrong = useQuizStore(s => s.retryWrong);
  const clearWrongAnswers = useQuizStore(s => s.clearWrongAnswers);
  const status = useQuizStore(s => s.status);
  const questions = useQuizStore(s => s.questions);
  const answers = useQuizStore(s => s.answers);
  const isPractice = useQuizStore(s => s.isPractice);
  const tick = useQuizStore(s => s.tick);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [autoNextDelay, setAutoNextDelay] = useState(0);

  // Timer tick interval
  useEffect(() => {
    if (status !== 'doing') return;

    const timer = setInterval(() => {
      tick();
    }, 1000);

    return () => clearInterval(timer);
  }, [status, tick]);

  // Auto-redirect if quiz times out and submits
  useEffect(() => {
    if (status === 'submitted') {
      const attemptId = useQuizStore.getState().attemptId;
      if (attemptId) {
        router.push(`/result/${attemptId}`);
      }
    }
  }, [status, router]);

  const initQuiz = async () => {
    setLoading(true);
    setLoadError(null);
    const params = new URLSearchParams(window.location.search);
    const retryAttemptId = params.get('retry_attempt');

    try {
      if (retryAttemptId) {
        await retryWrong(Number(retryAttemptId));
      } else {
        const config = {
          mode: params.get('mode') || 'exam',
          shuffleQuestions: params.get('shuffleQ') === '1',
          shuffleOptions: params.get('shuffleO') === '1',
          autoNextDelay: Number(params.get('delay')) || 0,
          unlimitedTime: params.get('unlimited') === '1'
        };
        setAutoNextDelay(config.autoNextDelay);
        await startQuiz(Number(id), config.mode, config.unlimitedTime, config.shuffleQuestions, config.shuffleOptions);
      }
    } catch (error: any) {
      if (error.response?.status !== 401) {
        setLoadError('Không thể tải đề thi. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initQuiz();
  }, [id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === 'ArrowLeft') {
        setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [questions.length]);

  const handleSelectOption = (optionId: number) => {
    if (!questions[currentQuestionIndex]) return;
    selectAnswer(questions[currentQuestionIndex].id, optionId);
    
    // Tự động chuyển câu nếu được cấu hình
    if (autoNextDelay > 0) {
      setTimeout(() => {
        setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1));
      }, autoNextDelay * 1000);
    }
  };

  const handleExit = () => {
    const answeredCount = Object.keys(answers).length;
    if (answeredCount > 0) {
      if (!window.confirm("Bạn có bài thi đang làm dở. Bạn có chắc chắn muốn quay về trang chủ không?")) {
        return;
      }
    }
    router.push('/dashboard');
  };

  const handleSubmit = async () => {
    const unansweredCount = questions.length - Object.keys(answers).length;
    const confirmMsg = unansweredCount > 0 
      ? `Bạn còn ${unansweredCount} câu chưa trả lời. Bạn có chắc chắn muốn nộp bài thi ngay không?`
      : "Bạn có chắc chắn muốn nộp bài thi?";

    if (!window.confirm(confirmMsg)) return;

    setSubmitting(true);
    try {
      const result = await submitQuiz();
      if (result) {
        router.push(`/result/${result.id}`);
      }
    } catch (error: any) {
      alert("Có lỗi xảy ra khi nộp bài thi. Vui lòng kiểm tra lại kết nối và thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progressPercentage = questions.length > 0 ? (Object.keys(answers).length / questions.length) * 100 : 0;

  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50">
        <div className="w-12 h-12 border-4 border-border border-t-[#4F7CFF] rounded-full animate-spin mb-4"></div>
        <p className="text-muted-foreground font-medium">Đang tải đề thi...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center p-6 bg-background z-50 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Không thể tải đề thi</h2>
        <p className="text-muted-foreground max-w-sm mb-6">{loadError}</p>
        <div className="flex gap-3">
          <button 
            onClick={() => router.push('/dashboard')}
            className="px-5 py-2.5 rounded-xl border border-border bg-card text-foreground font-semibold hover:bg-muted"
          >
            Về trang chủ
          </button>
          <button 
            onClick={initQuiz}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shadow-sm"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0 || !currentQuestion) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center p-6 bg-background z-50 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Đề thi chưa có câu hỏi</h2>
        <p className="text-muted-foreground max-w-sm mb-6">Đề thi này hiện chưa có nội dung câu hỏi nào để luyện tập.</p>
        <button 
          onClick={() => router.push('/dashboard')}
          className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
        >
          Quay lại trang chủ
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-background text-foreground z-50 overflow-hidden font-sans">
      
      {/* Top Area */}
      <header className="h-[72px] shrink-0 bg-card/90 backdrop-blur-md border-b border-border flex flex-col justify-center px-4 md:px-6 shadow-xs z-20">
        <div className="flex items-center justify-between w-full relative z-10 mb-1">
          <div className="flex items-center gap-3 md:gap-4">
            <button 
              onClick={handleExit}
              aria-label="Thoát về trang chủ"
              className="p-2 -ml-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h1 className="font-bold text-[16px] md:text-[17px] text-foreground hidden sm:block tracking-tight truncate max-w-[200px] md:max-w-md">
              Đang làm bài #{id}
            </h1>
          </div>
          
          <div className="flex items-center gap-3 md:gap-4">
            <QuizTimer />
            <button 
              onClick={handleSubmit} 
              disabled={submitting} 
              aria-label="Nộp bài thi"
              className="flex items-center gap-1.5 md:gap-2 bg-[#10B981] hover:bg-emerald-600 text-white font-bold px-4 py-2 md:px-5 md:py-2 text-sm rounded-full shadow-[0_2px_10px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Đang nộp...</>
              ) : (
                <><CheckCircle2 className="w-4 h-4" /> Nộp bài</>
              )}
            </button>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
          <div 
            className="h-full bg-primary transition-all duration-300 ease-out shadow-[0_0_8px_var(--primary)]"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Ambient background glow - Optimized for GPU */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none opacity-40" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)' }}></div>

        {/* LEFT/CENTER: Question Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 relative z-10 scrollbar-hide">
          <div 
            key={currentQuestion.id}
            className="max-w-4xl mx-auto flex flex-col h-full animate-in fade-in slide-in-from-right-3 duration-200 ease-out motion-reduce:animate-none"
          >
            <div className="flex items-center justify-between text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-6">
              <span>Câu hỏi {currentQuestionIndex + 1} / {questions.length}</span>
              <span className="bg-muted px-3 py-1 rounded-full border border-border text-primary font-bold">1 Điểm</span>
            </div>
            
            <div className="bg-card rounded-[20px] border border-border p-6 md:p-10 shadow-xs mb-6 shrink-0">
              <h2 className="text-[20px] md:text-[24px] font-semibold leading-[1.6] text-foreground break-words">
                {currentQuestion.question_text}
              </h2>
            </div>
            
            <div className="space-y-3.5">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = answers[currentQuestion.id] === option.id;
                const hasAnswered = !!answers[currentQuestion.id];
                const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
                
                let boxClass = "border-border bg-card hover:border-primary/50 hover:bg-muted/40";
                let iconClass = "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary";
                let textClass = "text-foreground";

                if (isSelected) {
                  boxClass = "border-primary bg-primary/10 shadow-[0_4px_15px_rgba(79,124,255,0.15)]";
                  iconClass = "bg-primary text-white shadow-md shadow-blue-500/30";
                  textClass = "text-foreground font-medium";
                }

                if (isPractice && hasAnswered) {
                  const isCorrect = option.is_correct === 1 || option.is_correct === true || String(option.is_correct) === '1' || String(option.is_correct) === 'true';
                  if (isCorrect) {
                    boxClass = "border-[#10B981] bg-[#10B981]/10 shadow-[0_4px_15px_rgba(16,185,129,0.15)]";
                    iconClass = "bg-[#10B981] text-white font-bold shadow-md shadow-emerald-500/30";
                    textClass = "text-emerald-700 dark:text-emerald-400 font-semibold";
                  } else if (isSelected && !isCorrect) {
                    boxClass = "border-rose-500 bg-rose-500/10 shadow-[0_4px_15px_rgba(239,68,68,0.15)]";
                    iconClass = "bg-rose-500 text-white font-bold shadow-md shadow-red-500/30";
                    textClass = "text-rose-700 dark:text-rose-400 font-semibold";
                  } else {
                    boxClass = "border-border bg-secondary/50 opacity-50 pointer-events-none";
                    iconClass = "bg-muted text-muted-foreground";
                    textClass = "text-muted-foreground";
                  }
                }
                
                return (
                  <div 
                    key={option.id}
                    onClick={() => !hasAnswered && handleSelectOption(option.id)}
                    className={cn(
                      "flex items-center p-4 md:p-5 rounded-[16px] border-2 transition-all duration-150 group cursor-pointer",
                      (!isPractice || !hasAnswered) ? "active:scale-[0.99]" : "cursor-default",
                      boxClass
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center font-bold mr-4 md:mr-5 transition-all duration-150 shrink-0",
                      iconClass
                    )}>
                      {letters[idx]}
                    </div>
                    <span className={cn("text-[15px] md:text-[16px] leading-relaxed break-words flex-1", textClass)}>
                      {cleanAnswerText(option.option_text)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between pt-8 mt-auto gap-3">
              <button 
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border bg-card text-foreground font-semibold hover:bg-muted transition-colors disabled:opacity-30 disabled:pointer-events-none active:scale-[0.98]"
              >
                <ChevronLeft className="w-5 h-5" /> Câu trước
              </button>
              <button 
                disabled={currentQuestionIndex === questions.length - 1}
                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all disabled:opacity-30 disabled:pointer-events-none shadow-sm hover:shadow-md active:scale-[0.98]"
              >
                Câu sau <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </main>

        {/* RIGHT: Question Navigator */}
        <aside className="w-full max-h-[40vh] md:max-h-none md:w-[320px] border-t md:border-t-0 md:border-l border-border bg-secondary/80 backdrop-blur-md flex flex-col shrink-0 z-20">
          <div className="p-4 md:p-6 font-bold border-b border-border flex items-center justify-between bg-card/50">
            <span className="text-foreground text-[15px]">Bảng câu hỏi</span>
            
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
          
          <div className="flex-1 overflow-y-auto min-h-0 p-4 md:p-6 scrollbar-hide">
            <div className="grid grid-cols-5 gap-2 md:gap-3">
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
          <div className="p-4 md:p-6 border-t border-border bg-card/80 grid grid-cols-2 gap-4 text-sm font-medium shrink-0">
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-[11px] uppercase tracking-wider">Đã làm</span>
              <span className="text-foreground text-lg">{Object.keys(answers).length}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-[11px] uppercase tracking-wider">Còn lại</span>
              <span className="text-foreground text-lg">{questions.length - Object.keys(answers).length}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
