"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuizStore } from "@/store/quizStore";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  X, 
  Loader2, 
  AlertCircle, 
  Flag, 
  Bookmark,
  Monitor, 
  Sparkles, 
  LayoutGrid,
  Maximize2,
  User,
  Volume2,
  VolumeX,
  ShieldAlert,
  Lightbulb,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatQuizDuration } from "@/lib/utils/time";
import { FormattedText, cleanOptionPrefix } from "@/components/quiz/FormattedText";
import { soundManager } from "@/lib/soundEffects";
import { AskAIModal } from "@/components/quiz/AskAIModal";

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
  isFlagged,
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
        "relative min-h-[44px] rounded-xl font-semibold text-[13px] flex items-center justify-center transition-all duration-150 hover:scale-105 border-2 focus-visible:ring-2 focus-visible:ring-primary",
        isCurrent ? "border-primary bg-card text-foreground ring-2 ring-primary/40 ring-offset-2 ring-offset-background shadow-md" : gridClass
      )}
    >
      {idx + 1}
      {isFlagged && (
        <span 
          title="Câu hỏi đã đánh dấu xem lại" 
          className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-xs text-[9px] font-black"
        >
          ⚑
        </span>
      )}
    </button>
  );
});

export default function QuizPlayerPage() {
  const { id } = useParams();
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  
  const startQuiz = useQuizStore(s => s.startQuiz);
  const selectAnswer = useQuizStore(s => s.selectAnswer);
  const submitQuiz = useQuizStore(s => s.submitQuiz);
  const clearQuiz = useQuizStore(s => s.clearQuiz);
  const retryWrong = useQuizStore(s => s.retryWrong);
  const clearWrongAnswers = useQuizStore(s => s.clearWrongAnswers);
  const status = useQuizStore(s => s.status);
  const questions = useQuizStore(s => s.questions);
  const answers = useQuizStore(s => s.answers);
  const isPractice = useQuizStore(s => s.isPractice);
  const remainingTime = useQuizStore(s => s.remainingTime);
  const elapsedTime = useQuizStore(s => s.elapsedTime);
  const tick = useQuizStore(s => s.tick);

  const [theme, setTheme] = useState<'modern' | 'itest'>('modern');
  const [showQuestionPalette, setShowQuestionPalette] = useState(false);
  const [showMobileStudentInfo, setShowMobileStudentInfo] = useState(false);
  const [showMobilePaletteModern, setShowMobilePaletteModern] = useState(false);
  const [quizInfo, setQuizInfo] = useState<{ title: string; category?: string } | null>(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [autoNextDelay, setAutoNextDelay] = useState(0);
  const autoNextTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});
  const [showAskAI, setShowAskAI] = useState(false);
  const [aiModalMode, setAiModalMode] = useState<"explain" | "debate" | "mnemonic">("explain");

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

  const toggleFlagCurrent = () => {
    const q = questions[currentQuestionIndex];
    if (!q) return;
    setFlaggedQuestions(prev => ({
      ...prev,
      [q.id]: !prev[q.id]
    }));
  };

  const jumpToNextSaved = () => {
    const savedIndices = questions
      .map((q, idx) => flaggedQuestions[q.id] ? idx : -1)
      .filter(idx => idx !== -1);
    
    if (savedIndices.length === 0) return;

    const nextIdx = savedIndices.find(idx => idx > currentQuestionIndex);
    if (nextIdx !== undefined) {
      setCurrentQuestionIndex(nextIdx);
    } else {
      // Quay vòng lại câu đã lưu đầu tiên
      setCurrentQuestionIndex(savedIndices[0]);
    }
  };

  // Timer tick interval
  useEffect(() => {
    if (status !== 'doing') return;

    const timer = setInterval(() => {
      tick();
    }, 1000);

    return () => clearInterval(timer);
  }, [status, tick]);

  const initQuiz = async () => {
    setLoading(true);
    setLoadError(null);
    setCurrentQuestionIndex(0);
    setFlaggedQuestions({});

    const params = new URLSearchParams(window.location.search);
    const retryAttemptId = params.get('retry_attempt');
    const themeParam = params.get('theme') as 'modern' | 'itest';
    if (themeParam === 'itest' || themeParam === 'modern') {
      setTheme(themeParam);
    }

    // Tải thông tin đề thi để hiển thị tiêu đề môn thi
    try {
      const { data } = await api.get(`/quizzes/${id}`);
      if (data.success && data.data) {
        setQuizInfo({
          title: data.data.title,
          category: data.data.category?.name
        });
      }
    } catch (e) {
      // Bỏ qua lỗi tải info nếu có
    }

    // Đọc và phân tích cấu hình thời gian tự chuyển câu (xử lý an toàn '2s', '1.5s', 'off', v.v.)
    const rawDelay = params.get('delay');
    let parsedDelay = 0;
    if (rawDelay && rawDelay !== 'off') {
      const match = String(rawDelay).match(/(\d+(?:\.\d+)?)/);
      if (match) {
        parsedDelay = parseFloat(match[1]) || 0;
      }
    } else if (!rawDelay) {
      try {
        const savedDelay = localStorage.getItem('openquiz_auto_next_delay');
        if (savedDelay) {
          parsedDelay = parseFloat(savedDelay) || 0;
        }
      } catch {}
    }
    setAutoNextDelay(parsedDelay);

    try {
      if (retryAttemptId) {
        const retryData = await retryWrong(Number(retryAttemptId));
        if (retryData && retryData.questions) {
          const answersMap = retryData.answers || {};
          const firstWrongIdx = retryData.questions.findIndex((q: any) => !answersMap[q.id]);
          if (firstWrongIdx !== -1) {
            setCurrentQuestionIndex(firstWrongIdx);
          }
        }
      } else {
        const modeParam = params.get('mode');
        const limitParam = Number(params.get('limit')) || 0;
        const config = {
          mode: modeParam || 'practice',
          shuffleQuestions: params.get('shuffleQ') === '1',
          shuffleOptions: params.get('shuffleO') === '1',
          autoNextDelay: parsedDelay,
          unlimitedTime: params.get('unlimited') === '1' || modeParam === 'practice' || !modeParam,
          questionLimit: limitParam
        };
        await startQuiz(
          Number(id), 
          config.mode, 
          config.unlimitedTime, 
          config.shuffleQuestions, 
          config.shuffleOptions, 
          true,
          config.questionLimit
        );
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

  const [soundOn, setSoundOn] = useState(soundManager.isEnabled());
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);

  const handleToggleSound = () => {
    const newState = soundManager.toggle();
    setSoundOn(newState);
  };

  useEffect(() => {
    if (status !== 'doing' || isPractice) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => {
          const next = prev + 1;
          setShowWarningModal(true);
          return next;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [status, isPractice]);

  const handleSelectOption = (optionId: number) => {
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return;
    selectAnswer(currentQ.id, optionId);

    // Phát âm thanh phản hồi xúc giác
    if (isPractice) {
      const opt = currentQ.options?.find(o => o.id === optionId);
      const isCorrect = opt && (opt.is_correct === 1 || opt.is_correct === true || String(opt.is_correct) === '1' || String(opt.is_correct) === 'true');
      if (isCorrect) {
        soundManager.playCorrect();
      } else {
        soundManager.playWrong();
      }
    } else {
      soundManager.playClick();
    }
    
    // Dọn dẹp timer cũ trước khi lên lịch chuyển câu mới
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }

    // Tự động chuyển câu nếu được cấu hình và chưa phải câu cuối
    if (autoNextDelay > 0 && currentQuestionIndex < questions.length - 1) {
      autoNextTimerRef.current = setTimeout(() => {
        setCurrentQuestionIndex(prev => {
          if (prev < questions.length - 1) return prev + 1;
          return prev;
        });
        autoNextTimerRef.current = null;
      }, autoNextDelay * 1000);
    }
  };

  // Hủy timer chuyển câu khi unmount hoặc khi người dùng tự chuyển câu bằng tay
  useEffect(() => {
    return () => {
      if (autoNextTimerRef.current) {
        clearTimeout(autoNextTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
  }, [currentQuestionIndex]);

  // Keyboard navigation & Quick Answer shortcuts: A, B, C, D & Arrows
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;

      const q = questions[currentQuestionIndex];

      if (e.key === 'ArrowLeft') {
        setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1));
      } else if (['a', 'A'].includes(e.key) && q && q.options[0]) {
        handleSelectOption(q.options[0].id);
      } else if (['b', 'B'].includes(e.key) && q && q.options[1]) {
        handleSelectOption(q.options[1].id);
      } else if (['c', 'C'].includes(e.key) && q && q.options[2]) {
        handleSelectOption(q.options[2].id);
      } else if (['d', 'D'].includes(e.key) && q && q.options[3]) {
        handleSelectOption(q.options[3].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [questions, currentQuestionIndex, autoNextDelay]);

  const handleExit = () => {
    const answeredCount = Object.keys(answers).length;
    if (answeredCount > 0) {
      if (!window.confirm("Bạn có bài đang làm dở. Bạn có chắc chắn muốn quay về trang chủ không?")) {
        return;
      }
    }
    clearQuiz();
    router.push('/dashboard');
  };

  const handleSubmit = async (isAutoTimeout: boolean | any = false) => {
    if (submitting) return;

    if (isAutoTimeout !== true) {
      const unansweredCount = questions.length - Object.keys(answers).length;
      const confirmMsg = isPractice
        ? (unansweredCount > 0 
            ? `Bạn còn ${unansweredCount} câu chưa hoàn thành. Bạn có chắc chắn muốn kết thúc và nộp bài ôn tập không?`
            : "Bạn có chắc chắn muốn hoàn thành bài ôn tập?")
        : (unansweredCount > 0 
            ? `Bạn còn ${unansweredCount} câu chưa trả lời. Bạn có chắc chắn muốn nộp bài thi ngay không?`
            : "Bạn có chắc chắn muốn nộp bài thi?");

      if (!window.confirm(confirmMsg)) return;
    }

    setSubmitting(true);
    try {
      const result = await submitQuiz();
      if (result) {
        soundManager.playFinish();
        setFlaggedQuestions({});
        router.push(`/result/${result.id}`);
      }
    } catch (error: any) {
      alert("Có lỗi xảy ra khi nộp bài thi. Vui lòng kiểm tra lại kết nối và thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  // Tự động nộp bài khi hết giờ ở chế độ có tính giờ
  useEffect(() => {
    if (status === 'doing' && remainingTime !== null && remainingTime <= 0 && !submitting && !loading) {
      handleSubmit(true);
    }
  }, [status, remainingTime, submitting, loading]);

  const currentQuestion = questions[currentQuestionIndex];
  const progressPercentage = questions.length > 0 ? (Object.keys(answers).length / questions.length) * 100 : 0;

  // iTest formatted student info
  const studentCode = user?.id ? `282322${String(user.id).padStart(4, '0')}` : "2823225048";
  const studentName = user?.name || "Nguyễn Văn Nhật";
  const examDateStr = useMemo(() => {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    return `L1 - ${d}/${m}/${y}`;
  }, []);

  const timeDisplaySeconds = remainingTime !== null ? remainingTime : elapsedTime;
  const timerMinutes = Math.floor(timeDisplaySeconds / 60);
  const timerSeconds = timeDisplaySeconds % 60;

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

  // =========================================================================
  // GIAO DIỆN 1: MÔ PHỎNG PHÒNG THI CHUẨN TRƯỜNG iTest (v12.2025)
  // Chuẩn 1:1 theo ảnh chụp phòng máy thật của trường
  // =========================================================================
  if (theme === 'itest') {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const currentAnsId = answers[currentQuestion.id];
    const isSavedCurrent = !!flaggedQuestions[currentQuestion.id];
    const savedCount = Object.values(flaggedQuestions).filter(Boolean).length;

    const renderStudentCard = (isModal = false) => (
      <div className={cn("flex flex-col text-[#000000] select-text", isModal ? "p-3 space-y-2.5" : "h-full")}>
        {/* Ảnh thẻ 3x4 sinh viên chuẩn phông xanh */}
        <div className="flex justify-center mb-2">
          <div className="w-[110px] sm:w-[125px] h-[145px] sm:h-[165px] bg-[#2563eb] border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
            <img 
              src={user?.avatar || "/images/itest_student.jpg"} 
              alt="Ảnh thí sinh" 
              className="w-full h-full object-cover object-top" 
              onError={(e: any) => {
                e.currentTarget.src = "/images/itest_student.jpg";
              }}
            />
          </div>
        </div>

        {/* Thông tin thí sinh chuẩn mẫu iTest */}
        <div className="space-y-1 font-sans text-[13px] sm:text-[14px] leading-tight text-[#000000] pb-2">
          <div className="font-sans font-normal truncate">
            Mã: <strong className="font-bold">{studentCode}</strong>
          </div>
          <div className="font-bold truncate text-[14px]">
            {studentName}
          </div>
          <div className="text-[#222]">
            13/12/2005
          </div>
          <div className="text-[#222]">
            04
          </div>
          <div className="text-[#333] pt-0.5 text-[12px]">
            {examDateStr}
          </div>
        </div>

        {/* Vạch kẻ ngăn cách */}
        <div className="border-t border-dashed border-[#8c8474] my-1"></div>

        {/* Trạng thái thi: Câu: 58/ 60 & Làm bài còn: 23' */}
        <div className="space-y-1 font-sans text-[13px] sm:text-[14px] text-[#000000]">
          <div className="font-bold text-[#000000]">
            Câu: {currentQuestionIndex + 1}/ {questions.length}
          </div>
          <div className="font-bold text-[#b91c1c] sm:text-[#000000]">
            Làm bài còn: {timerMinutes}' {timerSeconds < 10 ? `0${timerSeconds}` : timerSeconds}"
          </div>
          <div className="text-[12px] text-[#444444] pt-0.5 font-mono">
            iTest v12.2025
          </div>
        </div>

        {/* Khu vực: Lưu câu hỏi để tí nữa làm sau */}
        <div className="bg-[#ede7da] border border-[#b8b09e] p-2.5 rounded-xs space-y-2 my-2 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#554d3e] uppercase">
            <span className="flex items-center gap-1">
              <Bookmark className="w-3.5 h-3.5 text-[#b45309]" />
              Lưu câu hỏi làm sau
            </span>
            <span className="bg-[#dfd8ca] px-1.5 py-0.5 rounded text-[11px] font-bold text-[#333]">
              {savedCount} câu
            </span>
          </div>

          <button
            type="button"
            onClick={toggleFlagCurrent}
            className={cn(
              "w-full py-2 px-2 rounded-xs border text-xs font-bold font-sans flex items-center justify-center gap-1.5 transition-all shadow-xs active:translate-y-px",
              isSavedCurrent
                ? "bg-[#fef3c7] text-[#92400e] border-[#d97706] shadow-xs"
                : "bg-[#ffffff] hover:bg-[#faf7f0] text-[#222222] border-[#9e9788]"
            )}
          >
            <Bookmark className={cn("w-4 h-4", isSavedCurrent && "fill-[#d97706] text-[#d97706]")} />
            <span>{isSavedCurrent ? "✓ Đã lưu câu này (Làm sau)" : "📌 Lưu câu này để làm sau"}</span>
          </button>

          {savedCount > 0 && (
            <button
              type="button"
              onClick={() => {
                jumpToNextSaved();
                if (isModal) setShowMobileStudentInfo(false);
              }}
              className="w-full py-1.5 px-2 bg-[#dfd7c7] hover:bg-[#d5ccba] text-[#2e281f] text-[11px] font-bold rounded-xs border border-[#aba18e] flex items-center justify-center gap-1 transition-colors active:translate-y-px"
            >
              <span>⏭ Xem câu đã lưu tiếp theo ({savedCount})</span>
            </button>
          )}
        </div>

        {/* Nút nộp bài trực tiếp */}
        <div className="mt-auto pt-2">
          <button
            type="button"
            onClick={() => {
              if (isModal) setShowMobileStudentInfo(false);
              handleSubmit();
            }}
            disabled={submitting}
            className="w-full py-2.5 px-2 bg-[#b91c1c] hover:bg-[#991b1b] text-white text-[13px] font-bold font-sans rounded-xs shadow-xs tracking-wide transition-all disabled:opacity-50 active:translate-y-px"
          >
            {submitting ? "Đang nộp bài..." : "Nộp bài thi"}
          </button>
        </div>
      </div>
    );

    return (
      <div className="fixed inset-0 flex flex-col bg-[#cfc6b4] text-[#000000] z-50 overflow-hidden font-sans select-none">
        
        {/* 1. Thanh tiêu đề cửa sổ Windows classic */}
        <div className="h-6 bg-gradient-to-r from-[#0a246a] via-[#104f96] to-[#a6caf0] text-white flex items-center justify-between px-2 text-[11px] font-sans shrink-0 border-b border-[#001040]">
          <div className="flex items-center gap-1.5 font-bold tracking-tight truncate max-w-[200px] sm:max-w-none">
            <span className="w-3 h-3 bg-blue-300 rounded-xs inline-block shrink-0"></span>
            <span className="truncate">TRẮC NGHIỆM :: iTest v12.2025</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Nút điều chỉnh Tự chuyển câu nhanh trong iTest */}
            <button
              onClick={() => {
                const nextDelay = autoNextDelay === 0 ? 1 : autoNextDelay === 1 ? 2 : autoNextDelay === 2 ? 3 : 0;
                setAutoNextDelay(nextDelay);
                try {
                  localStorage.setItem('openquiz_auto_next_delay', String(nextDelay));
                } catch {}
              }}
              title="Bấm để đổi tốc độ tự động chuyển sang câu tiếp theo"
              className={cn(
                "px-2 py-0.2 text-[10px] font-sans border rounded-xs shadow-xs transition-colors",
                autoNextDelay > 0
                  ? "bg-[#d4edda] text-[#155724] border-[#c3e6cb] font-bold"
                  : "bg-[#ece9d8] hover:bg-white text-black border-[#707070]"
              )}
            >
              ⚡ Tự chuyển: {autoNextDelay > 0 ? `${autoNextDelay}s` : "Tắt"}
            </button>

            <button
              onClick={() => setTheme('modern')}
              title="Đổi sang giao diện OpenQuiz hiện đại"
              className="px-2 py-0.2 bg-[#ece9d8] hover:bg-white text-black text-[10px] font-sans border border-[#707070] rounded-xs shadow-xs"
            >
              <span className="hidden sm:inline">🌟 Đổi giao diện Hiện đại</span>
              <span className="sm:hidden inline">🌟 Hiện đại</span>
            </button>
            <button
              onClick={handleExit}
              title="Thoát phòng thi"
              className="px-1.5 py-0.2 bg-[#c0392b] hover:bg-[#e74c3c] text-white text-[10px] font-bold rounded-xs"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 2. Thanh Header iTest đặc trưng: Nền Dark Navy + Chữ Vàng Rực Rỡ */}
        <div className="h-10 sm:h-11 bg-[#0a192f] border-b-2 border-[#ffea00] flex items-center justify-between px-2.5 sm:px-5 shrink-0 shadow-md">
          {/* MÁY : 12 / PHÒNG THI */}
          <div className="flex items-center gap-2">
            <span className="text-[#ffea00] font-black text-base sm:text-2xl font-mono tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              MÁY : 12
            </span>
          </div>

          {/* MÔN HỌC */}
          <div className="text-center truncate px-2 max-w-[160px] sm:max-w-md">
            <span className="text-[#ffea00] font-bold text-xs sm:text-lg uppercase tracking-wider font-sans drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] truncate block">
              MÔN {quizInfo?.title ? quizInfo.title.toUpperCase() : "CÔNG NGHỆ JAVA"}
            </span>
          </div>

          {/* Góc phải: Thí sinh button on mobile */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowMobileStudentInfo(true)}
              className="md:hidden px-2 py-0.5 bg-[#dfd7c8] hover:bg-white text-black text-[11px] font-bold rounded-xs border border-[#8c8474] flex items-center gap-1 shadow-xs"
            >
              <User className="w-3 h-3" />
              <span>Thí sinh</span>
              {savedCount > 0 && (
                <span className="bg-[#b45309] text-white text-[9px] px-1 rounded-full font-bold">
                  {savedCount}
                </span>
              )}
            </button>
            <span className="text-[#a0aec0] font-mono text-xs hidden sm:inline">iTest Online</span>
          </div>
        </div>

        {/* Mobile quick status strip */}
        <div className="md:hidden bg-[#ede7da] border-b border-[#a89f8d] px-2.5 py-1.5 flex items-center justify-between text-xs font-sans text-black shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold">Câu {currentQuestionIndex + 1}/{questions.length}</span>
            <span className="text-[#8c8474]">|</span>
            <span className="font-bold text-[#b91c1c]">⏳ {timerMinutes}' {timerSeconds < 10 ? `0${timerSeconds}` : timerSeconds}"</span>
          </div>
          <div className="flex items-center gap-1.5">
            {savedCount > 0 && (
              <button
                type="button"
                onClick={jumpToNextSaved}
                className="text-[11px] bg-[#dfd8ca] px-1.5 py-0.5 rounded border border-[#aba18e] font-bold"
              >
                ⏭ Câu lưu ({savedCount})
              </button>
            )}
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={submitting}
              className="px-2 py-0.5 bg-[#b91c1c] text-white text-[11px] font-bold rounded shadow-xs"
            >
              Nộp bài
            </button>
          </div>
        </div>

        {/* 3. Thân ứng dụng: Cột Thí sinh bên trái (Desktop) & Trang giấy thi bên phải */}
        <div className="flex-1 flex overflow-hidden p-1.5 sm:p-2.5 md:p-3 gap-2 sm:gap-2.5 bg-[#cfc6b4]">
          
          {/* CỘT TRÁI: Thẻ Sinh Viên Chuẩn Phòng Thi (Chỉ hiện trên desktop/tablet md:) */}
          <aside className="hidden md:flex w-60 sm:w-68 md:w-76 bg-[#dfd7c8] border border-[#a89f8d] flex-col p-3 text-[#000000] shrink-0 select-text rounded-xs shadow-xs overflow-y-auto">
            {renderStudentCard(false)}
          </aside>

          {/* CỘT PHẢI: Khung giấy thi (Chiếm 100% chiều rộng trên mobile) */}
          <main className="flex-1 w-full flex flex-col bg-[#fcf9f0] border border-[#aba18e] rounded-xs shadow-xs overflow-hidden">
            
            {/* Nội dung đề thi cuộn mượt mà */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-8 font-serif text-[#000000] select-text">
              
              {/* Vạch kẻ phân đoạn :: Câu hỏi :: */}
              <div className="relative flex items-center justify-center my-1.5 sm:my-2 text-xs md:text-sm text-[#444444] font-mono">
                <div className="border-t border-dashed border-[#8c8474] w-full"></div>
                <span className="absolute bg-[#fcf9f0] px-3 font-serif font-normal text-[14px] sm:text-[15px] text-[#222222]">
                  :: Câu hỏi ::
                </span>
              </div>

              {/* Nội dung câu hỏi và code snippet (Times New Roman, thụt lề chuẩn, font 16-18px) */}
              <div 
                className="text-[16px] sm:text-[17px] md:text-[18px] leading-relaxed my-3 sm:my-4 text-[#000000] whitespace-pre-wrap break-words"
                style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}
              >
                <FormattedText text={currentQuestion.question_text} />
              </div>

              {/* Vạch kẻ phân đoạn :: Trả lời :: */}
              <div className="relative flex items-center justify-center my-4 sm:my-6 text-xs md:text-sm text-[#444444] font-mono">
                <div className="border-t border-dashed border-[#8c8474] w-full"></div>
                <span className="absolute bg-[#fcf9f0] px-3 font-serif font-normal text-[14px] sm:text-[15px] text-[#222222]">
                  :: Trả lời ::
                </span>
              </div>

              {/* Danh sách lựa chọn A, B, C, D hiển thị cách dòng chuẩn theo ảnh, font 15-17px */}
              <div 
                className="space-y-3 sm:space-y-4 text-[15px] sm:text-[16px] md:text-[17px] text-[#000000] max-w-4xl pt-1"
                style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}
              >
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = currentAnsId === option.id;
                  const hasAnswered = !!currentAnsId;
                  const isCorrect = option.is_correct === 1 || option.is_correct === true || String(option.is_correct) === '1' || String(option.is_correct) === 'true';

                  let optHighlight = "hover:bg-[#f3efe4]/80";
                  if (isSelected) {
                    optHighlight = "bg-[#e8f0fe] font-semibold text-[#0f2e5c] border-l-4 border-[#1a569d] pl-2 sm:pl-2.5";
                  }

                  if (isPractice && hasAnswered) {
                    if (isCorrect) {
                      optHighlight = "bg-emerald-100 text-emerald-950 font-semibold border-l-4 border-emerald-600 pl-2 sm:pl-2.5";
                    } else if (isSelected && !isCorrect) {
                      optHighlight = "bg-rose-100 text-rose-950 font-semibold border-l-4 border-rose-600 pl-2 sm:pl-2.5";
                    }
                  }

                  return (
                    <div
                      key={option.id}
                      onClick={() => (!isPractice || !hasAnswered) && handleSelectOption(option.id)}
                      className={cn(
                        "py-2 px-2 sm:px-2.5 rounded-xs transition-colors cursor-pointer flex items-baseline gap-2 sm:gap-2.5 leading-relaxed active:bg-[#ede7da]",
                        optHighlight
                      )}
                    >
                      <span className="font-serif font-bold text-[#000000] shrink-0">
                        {letters[idx]})
                      </span>
                      <div className="flex-1 break-words">
                        <FormattedText text={cleanOptionPrefix(option.option_text)} />
                      </div>
                      {isPractice && hasAnswered && isCorrect && (
                        <span className="text-[11px] sm:text-xs bg-emerald-600 text-white font-sans px-1.5 sm:px-2 py-0.5 rounded-xs font-bold shrink-0">
                          Đáp án đúng
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Vùng giải thích nếu ở chế độ ôn tập */}
              {isPractice && currentAnsId && (
                <div className="mt-6 sm:mt-8 p-3 sm:p-3.5 bg-[#f4f0e6] border border-[#c4bcae] rounded-xs text-xs sm:text-sm font-sans text-gray-800">
                  <div className="font-bold text-[#1e293b] mb-1">
                    ✓ Đã ghi nhận câu trả lời.
                  </div>
                  {currentQuestion.options.find(o => o.id === currentAnsId)?.is_correct ? (
                    <p className="text-emerald-700 font-semibold">Bạn đã trả lời chính xác!</p>
                  ) : (
                    <p className="text-rose-700 font-semibold">Đáp án chưa chính xác, hãy chú ý nhé!</p>
                  )}
                </div>
              )}
            </div>

            {/* THANH ĐIỀU KHIỂN DƯỚI: Các nút [ A ] [ B ] [ C ] [ D ] co giãn linh hoạt */}
            <div className="h-13 sm:h-14 md:h-15 bg-[#dfd7c8] border-t border-[#a89f8d] px-2 sm:px-3.5 flex items-center justify-between shrink-0 shadow-inner gap-1 sm:gap-2">
              
              {/* Nhóm bên trái: [ Bảng câu hỏi ] và các phím [ A ] [ B ] [ C ] [ D ] */}
              <div className="flex items-center gap-1.5 sm:gap-3">
                {/* Nút Bảng câu hỏi */}
                <button
                  type="button"
                  onClick={() => setShowQuestionPalette(true)}
                  className="h-9 sm:h-10 px-2 sm:px-3.5 bg-[#fbf8f1] hover:bg-white text-gray-900 text-xs sm:text-sm font-sans font-bold rounded-xs border-2 border-[#6d6657] shadow-xs flex items-center gap-1 active:translate-y-px shrink-0"
                >
                  <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-800" />
                  <span className="hidden sm:inline">Bảng câu hỏi</span>
                  <span className="sm:hidden inline">Bảng</span>
                </button>

                {/* Các nút [ A ] [ B ] [ C ] [ D ] */}
                <div className="flex items-center gap-1 sm:gap-2">
                  {['A', 'B', 'C', 'D'].map((letter, idx) => {
                    const opt = currentQuestion.options[idx];
                    if (!opt) return null;
                    const isSelected = currentAnsId === opt.id;

                    return (
                      <button
                        key={letter}
                        type="button"
                        onClick={() => handleSelectOption(opt.id)}
                        title={`Chọn đáp án ${letter}`}
                        className={cn(
                          "w-9 sm:w-12 md:w-14 h-9 sm:h-10 md:h-11 rounded-xs font-sans font-black text-sm sm:text-base md:text-lg border-2 transition-all flex items-center justify-center shadow-xs shrink-0",
                          isSelected
                            ? "bg-[#0f3d75] text-white border-[#082242] ring-2 ring-blue-400 font-black shadow-md"
                            : "bg-[#fbf8f1] text-black border-[#6d6657] hover:bg-white active:bg-[#ede7da]"
                        )}
                      >
                        {letter}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nhóm bên phải: Câu trước / Câu sau */}
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <button
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                  className="h-9 sm:h-10 px-2 sm:px-3 bg-[#fbf8f1] hover:bg-white text-gray-900 text-xs sm:text-sm font-sans font-bold rounded-xs border-2 border-[#6d6657] disabled:opacity-40 shadow-xs flex items-center gap-1 active:translate-y-px"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Câu trước</span>
                </button>
                <button
                  disabled={currentQuestionIndex === questions.length - 1}
                  onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                  className="h-9 sm:h-10 px-2 sm:px-3 bg-[#0f3d75] hover:bg-[#1a569d] text-white text-xs sm:text-sm font-sans font-bold rounded-xs border-2 border-[#082242] shadow-xs flex items-center gap-1 disabled:opacity-40 active:translate-y-px"
                >
                  <span className="hidden sm:inline">Câu sau</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </div>

          </main>
        </div>

        {/* Mobile Student Info Drawer */}
        {showMobileStudentInfo && (
          <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div className="fixed inset-0" onClick={() => setShowMobileStudentInfo(false)} />
            <div className="relative w-full max-h-[85vh] bg-[#dfd7c8] border-t-2 border-[#8c8474] rounded-t-xl shadow-2xl z-10 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
              <div className="bg-[#0a192f] text-[#ffea00] px-4 py-2.5 flex items-center justify-between">
                <span className="font-bold text-xs">THÔNG TIN THÍ SINH & LƯU BÀI</span>
                <button 
                  onClick={() => setShowMobileStudentInfo(false)}
                  className="text-white hover:text-gray-300 font-bold px-2 py-0.5 text-sm"
                >
                  ✕
                </button>
              </div>
              <div className="overflow-y-auto flex-1 p-2">
                {renderStudentCard(true)}
              </div>
            </div>
          </div>
        )}

        {/* Modal Bảng câu hỏi (Question Grid Palette) cho iTest */}
        {showQuestionPalette && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-xl bg-[#dfd7c8] rounded-xs shadow-2xl border-2 border-[#6d6657] overflow-hidden flex flex-col max-h-[85vh]">
              
              <div className="bg-[#0a192f] text-[#ffea00] px-3.5 py-2.5 flex items-center justify-between border-b-2 border-[#6d6657]">
                <div className="flex items-center gap-2 font-bold font-sans text-xs sm:text-sm">
                  <LayoutGrid className="w-4 h-4 text-[#ffea00]" />
                  <span>DANH SÁCH CÂU HỎI ({Object.keys(answers).length}/{questions.length} ĐÃ LÀM)</span>
                </div>
                <button
                  onClick={() => setShowQuestionPalette(false)}
                  className="text-gray-300 hover:text-white px-2 py-0.5 hover:bg-white/10 rounded-xs text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="p-3.5 overflow-y-auto flex-1 bg-[#fcf9f0]">
                <div className="grid grid-cols-6 sm:grid-cols-10 gap-2 font-sans">
                  {questions.map((q, idx) => {
                    const isAnswered = !!answers[q.id];
                    const isCurrent = currentQuestionIndex === idx;
                    const isFlagged = !!flaggedQuestions[q.id];

                    let colorClass = "bg-[#fbf8f1] text-gray-800 border-[#aba18e] hover:bg-[#ede7da]";
                    if (isAnswered) {
                      colorClass = "bg-[#0f3d75] text-white border-[#082242] font-bold";
                    }
                    if (isCurrent) {
                      colorClass += " ring-2 ring-amber-500 font-black";
                    }

                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => {
                          setCurrentQuestionIndex(idx);
                          setShowQuestionPalette(false);
                        }}
                        className={cn(
                          "h-9 rounded-xs border flex items-center justify-center text-xs relative font-medium transition-all shadow-xs",
                          colorClass
                        )}
                      >
                        {idx + 1}
                        {isFlagged && (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 text-white rounded-full flex items-center justify-center text-[8px] font-bold">
                            ⚑
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 bg-[#dfd7c8] border-t border-[#aba18e] flex items-center justify-between text-xs text-gray-800 font-sans">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="w-3.5 h-3.5 bg-[#0f3d75] rounded-xs border border-[#082242]"></span> Đã làm
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3.5 h-3.5 bg-[#fbf8f1] border border-[#aba18e] rounded-xs"></span> Chưa làm
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3.5 h-3.5 bg-amber-500 rounded-xs"></span> Đã lưu
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuestionPalette(false)}
                  className="px-3.5 py-1.5 bg-[#475569] hover:bg-[#334155] text-white font-bold rounded-xs text-xs"
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

  // =========================================================================
  // GIAO DIỆN 2: OPENQUIZ HIỆN ĐẠI (MODERN UI)
  // =========================================================================
  const renderModernNavigator = (isModal = false) => (
    <div className="flex flex-col h-full">
      <div className="p-3.5 md:p-6 font-bold border-b border-border flex items-center justify-between bg-card/50 shrink-0">
        <span className="text-foreground text-[14px] md:text-[15px]">Bảng câu hỏi ({Object.keys(answers).length}/{questions.length})</span>
        
        <div className="flex items-center gap-2">
          {isPractice && Object.keys(answers).length > 0 && (
            <button 
              onClick={async () => {
                setClearing(true);
                try {
                  const wrongIndices: number[] = [];
                  questions.forEach((q, idx) => {
                    const ansId = answers[q.id];
                    if (ansId) {
                      const opt = q.options.find(o => o.id === ansId);
                      const isOptCorrect = opt && (opt.is_correct === 1 || opt.is_correct === true || String(opt.is_correct) === '1' || String(opt.is_correct) === 'true');
                      if (!isOptCorrect) {
                        wrongIndices.push(idx);
                      }
                    }
                  });

                  if (wrongIndices.length === 0) {
                    alert("Tất cả câu trả lời hiện tại đều đúng, không có câu sai cần làm lại!");
                    return;
                  }

                  await clearWrongAnswers();

                  if (wrongIndices.length > 0) {
                    setCurrentQuestionIndex(wrongIndices[0]);
                  }
                  if (isModal) setShowMobilePaletteModern(false);
                } catch (e) {
                  console.error("Lỗi xóa câu sai:", e);
                  alert("Có lỗi khi làm mới các câu sai. Vui lòng thử lại.");
                } finally {
                  setClearing(false);
                }
              }}
              disabled={clearing}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#F59E0B]/10 text-[#F59E0B] hover:bg-[#F59E0B]/20 border border-[#F59E0B]/20 transition-colors"
            >
              {clearing ? "Đang lọc..." : "Làm lại câu sai"}
            </button>
          )}

          {isModal && (
            <button
              onClick={() => setShowMobilePaletteModern(false)}
              className="p-1 rounded-lg hover:bg-muted text-muted-foreground text-sm font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto min-h-0 p-3.5 md:p-6 scrollbar-hide">
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
                isFlagged={!!flaggedQuestions[q.id]}
                onSelect={(selectedIdx: number) => {
                  setCurrentQuestionIndex(selectedIdx);
                  if (isModal) setShowMobilePaletteModern(false);
                }}
              />
            );
          })}
        </div>
      </div>
      
      {/* Navigator Footer Stats */}
      <div className="p-3.5 md:p-6 border-t border-border bg-card/80 grid grid-cols-3 gap-2 text-sm font-medium shrink-0">
        <div className="flex flex-col gap-0.5 sm:gap-1">
          <span className="text-muted-foreground text-[10px] sm:text-[11px] uppercase tracking-wider">Đã làm</span>
          <span className="text-foreground text-base sm:text-lg">{Object.keys(answers).length}</span>
        </div>
        <div className="flex flex-col gap-0.5 sm:gap-1">
          <span className="text-muted-foreground text-[10px] sm:text-[11px] uppercase tracking-wider">Đánh dấu</span>
          <span className="text-amber-600 dark:text-amber-400 font-bold text-base sm:text-lg">
            {Object.values(flaggedQuestions).filter(Boolean).length}
          </span>
        </div>
        <div className="flex flex-col gap-0.5 sm:gap-1">
          <span className="text-muted-foreground text-[10px] sm:text-[11px] uppercase tracking-wider">Còn lại</span>
          <span className="text-foreground text-base sm:text-lg">{questions.length - Object.keys(answers).length}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 flex flex-col bg-background text-foreground z-50 overflow-hidden font-sans">
      
      {/* Top Area */}
      <header className="h-14 sm:h-[72px] shrink-0 bg-card/90 backdrop-blur-md border-b border-border flex flex-col justify-center px-3 sm:px-6 shadow-xs z-20">
        <div className="flex items-center justify-between w-full relative z-10 mb-0.5 sm:mb-1">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button 
              onClick={handleExit}
              aria-label="Thoát về trang chủ"
              className="p-1.5 sm:p-2 -ml-1 sm:-ml-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
            <h1 className="font-bold text-[14px] sm:text-[17px] text-foreground tracking-tight truncate max-w-[140px] sm:max-w-md">
              {quizInfo?.title ? quizInfo.title : `Đang làm bài #${id}`}
            </h1>
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Nút bật/tắt âm thanh hiệu ứng */}
            <button
              onClick={handleToggleSound}
              type="button"
              title={soundOn ? "Tắt âm thanh hiệu ứng" : "Bật âm thanh hiệu ứng"}
              className="p-1.5 sm:p-2 rounded-full border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shadow-xs"
            >
              {soundOn ? (
                <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
              )}
            </button>

            {/* Nút điều chỉnh tốc độ Tự động chuyển câu */}
            <button
              onClick={() => {
                const nextDelay = autoNextDelay === 0 ? 1 : autoNextDelay === 1 ? 2 : autoNextDelay === 2 ? 3 : 0;
                setAutoNextDelay(nextDelay);
                try {
                  localStorage.setItem('openquiz_auto_next_delay', String(nextDelay));
                } catch {}
              }}
              type="button"
              title="Bấm để bật hoặc thay đổi thời gian tự động chuyển sang câu tiếp theo"
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border text-xs font-semibold transition-all shadow-xs cursor-pointer select-none",
                autoNextDelay > 0
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold shadow-emerald-500/10"
                  : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Zap className={cn("w-3.5 h-3.5", autoNextDelay > 0 ? "fill-emerald-500 text-emerald-500" : "")} />
              <span className="hidden sm:inline">Tự chuyển:</span>
              <span>{autoNextDelay > 0 ? `${autoNextDelay}s` : "Tắt"}</span>
            </button>

            {/* Nút chuyển đổi nhanh sang iTest Theme */}
            <button
              onClick={() => setTheme('itest')}
              title="Chuyển sang giao diện mô phỏng phòng thi iTest của trường"
              className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs hover:bg-amber-500/20 transition-all shadow-xs"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Chuẩn iTest</span>
            </button>

            <QuizTimer />
            
            <button 
              onClick={() => handleSubmit()} 
              disabled={submitting} 
              aria-label="Nộp bài thi"
              className="flex items-center gap-1 sm:gap-2 bg-[#10B981] hover:bg-emerald-600 text-white font-bold px-3 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm rounded-full shadow-[0_2px_10px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              {submitting ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> <span className="hidden sm:inline">Đang nộp...</span></>
              ) : (
                <><CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span>Nộp bài</span></>
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
        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none opacity-40" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)' }}></div>

        {/* LEFT/CENTER: Question Area */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 md:p-8 lg:p-12 relative z-10 scrollbar-hide pb-20 md:pb-8">
          <div 
            key={currentQuestion.id}
            className="max-w-4xl mx-auto flex flex-col min-h-full animate-in fade-in slide-in-from-right-3 duration-200 ease-out motion-reduce:animate-none"
          >
            <div className="flex items-center justify-between text-xs sm:text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <span>Câu {currentQuestionIndex + 1} / {questions.length}</span>
                <button
                  type="button"
                  onClick={toggleFlagCurrent}
                  className={cn(
                    "flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-xs",
                    flaggedQuestions[currentQuestion.id]
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40 shadow-amber-500/10"
                      : "bg-muted text-muted-foreground border-border hover:text-foreground hover:bg-muted/80"
                  )}
                  title="Đánh dấu xem lại trong phiên thi hiện tại"
                >
                  <Flag className={cn("w-3 h-3 sm:w-3.5 sm:h-3.5", flaggedQuestions[currentQuestion.id] && "fill-amber-500 text-amber-500")} />
                  <span>{flaggedQuestions[currentQuestion.id] ? "Đã lưu" : "Lưu sau"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleBookmark(currentQuestion.id)}
                  className={cn(
                    "flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-xs",
                    bookmarkedIds.includes(currentQuestion.id)
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40 shadow-amber-500/10"
                      : "bg-muted text-muted-foreground border-border hover:text-foreground hover:bg-muted/80"
                  )}
                  title="Lưu câu hỏi này vào Sổ tay câu khó vĩnh viễn"
                >
                  <Bookmark className={cn("w-3 h-3 sm:w-3.5 sm:h-3.5", bookmarkedIds.includes(currentQuestion.id) && "fill-amber-500 text-amber-500")} />
                  <span>{bookmarkedIds.includes(currentQuestion.id) ? "Sổ tay ✓" : "+ Sổ tay"}</span>
                </button>

                {/* Nút Mẹo nhớ 3s */}
                <button
                  type="button"
                  onClick={() => {
                    setAiModalMode("mnemonic");
                    setShowAskAI(true);
                  }}
                  className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-xs bg-gradient-to-r from-emerald-500/15 to-teal-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 hover:from-emerald-500/25 hover:to-teal-500/25 active:scale-95"
                  title="Xem mẹo nhớ nhanh 3 giây & thần chú ghi nhớ"
                >
                  <Lightbulb className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500" />
                  <span>Mẹo nhớ</span>
                </button>

                {/* Nút Hỏi AI */}
                <button
                  type="button"
                  onClick={() => {
                    setAiModalMode("explain");
                    setShowAskAI(true);
                  }}
                  className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-xs bg-gradient-to-r from-violet-500/15 to-indigo-500/15 text-violet-600 dark:text-violet-400 border-violet-500/40 hover:from-violet-500/25 hover:to-indigo-500/25 active:scale-95"
                  title="Hỏi AI giải thích hoặc tranh luận đáp án"
                >
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>Hỏi AI</span>
                </button>
              </div>
              <span className="bg-muted px-2.5 sm:px-3 py-1 rounded-full border border-border text-primary font-bold text-xs">1 Điểm</span>
            </div>
            
            <div className="bg-card rounded-[18px] sm:rounded-[20px] border border-border p-4 sm:p-6 md:p-10 shadow-xs mb-4 sm:mb-6 shrink-0">
              <h2 className="text-[17px] sm:text-[20px] md:text-[24px] font-semibold leading-[1.6] text-foreground break-words">
                <FormattedText text={currentQuestion.question_text} />
              </h2>
            </div>
            
            <div className="space-y-2.5 sm:space-y-3.5">
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
                    onClick={() => (!isPractice || !hasAnswered) && handleSelectOption(option.id)}
                    className={cn(
                      "flex items-center p-3.5 sm:p-4 md:p-5 rounded-[14px] sm:rounded-[16px] border-2 transition-all duration-150 group cursor-pointer active:scale-[0.99]",
                      (!isPractice || !hasAnswered) ? "active:scale-[0.99]" : "cursor-default",
                      boxClass
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold mr-3 sm:mr-4 md:mr-5 transition-all duration-150 shrink-0 text-sm sm:text-base",
                      iconClass
                    )}>
                      {letters[idx]}
                    </div>
                    <span className={cn("text-[14px] sm:text-[15px] md:text-[16px] leading-relaxed break-words flex-1", textClass)}>
                      <FormattedText text={cleanOptionPrefix(option.option_text)} />
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Desktop Navigation Buttons */}
            <div className="hidden md:flex items-center justify-between pt-8 mt-auto gap-3">
              <button 
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border bg-card text-foreground font-semibold hover:bg-muted transition-colors disabled:opacity-30 disabled:pointer-events-none active:scale-[0.98]"
              >
                <ChevronLeft className="w-5 h-5" /> Câu trước
              </button>
              <button 
                disabled={currentQuestionIndex === questions.length - 1}
                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all disabled:opacity-30 disabled:pointer-events-none shadow-sm hover:shadow-md active:scale-[0.98]"
              >
                Câu sau <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </main>

        {/* Mobile Floating Bottom Bar for Modern Theme */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 p-2 sm:p-2.5 bg-card/95 backdrop-blur-md border-t border-border flex items-center justify-between gap-2 z-30 shadow-lg">
          <button
            onClick={() => setShowMobilePaletteModern(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-secondary text-secondary-foreground rounded-xl text-xs font-semibold border border-border active:bg-muted"
          >
            <LayoutGrid className="w-4 h-4 text-primary" />
            <span>Câu {currentQuestionIndex + 1}/{questions.length}</span>
          </button>
          
          <div className="flex items-center gap-1.5">
            <button
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
              className="px-3 py-2 rounded-xl border border-border bg-card text-foreground font-semibold text-xs disabled:opacity-30 flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Trước</span>
            </button>
            <button
              disabled={currentQuestionIndex === questions.length - 1}
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
              className="px-3 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs disabled:opacity-30 flex items-center gap-1"
            >
              <span>Sau</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* RIGHT: Question Navigator (Desktop only) */}
        <aside className="hidden md:flex md:w-[320px] border-l border-border bg-secondary/80 backdrop-blur-md flex-col shrink-0 z-20">
          {renderModernNavigator(false)}
        </aside>

        {/* Mobile Bottom Sheet Drawer for Question Navigator */}
        {showMobilePaletteModern && (
          <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div className="fixed inset-0" onClick={() => setShowMobilePaletteModern(false)} />
            <div className="relative w-full max-h-[80vh] bg-card border-t border-border rounded-t-2xl shadow-2xl z-10 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
              {renderModernNavigator(true)}
            </div>
          </div>
        )}
      </div>

      {/* Cảnh báo chuyển tab (Chế độ thi trực tuyến) */}
      {showWarningModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border-2 border-rose-500 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/30">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-rose-600 dark:text-rose-400">
                Cảnh báo rời màn hình thi!
              </h3>
              <p className="text-sm text-foreground mt-1.5 leading-relaxed">
                Hệ thống phát hiện bạn vừa chuyển tab hoặc thu nhỏ cửa sổ làm bài.
              </p>
              <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-700 dark:text-rose-300">
                Số lần phát hiện: <span className="text-base font-black text-rose-600 dark:text-rose-400">{tabSwitchCount}</span> lần
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Vui lòng tập trung trên trang thi để kết quả được công nhận trung thực.
              </p>
            </div>
            <button
              onClick={() => setShowWarningModal(false)}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Tôi đã hiểu & Tiếp tục làm bài
            </button>
          </div>
        </div>
      )}

      {/* Hỏi AI Modal */}
      <AskAIModal
        isOpen={showAskAI}
        onClose={() => setShowAskAI(false)}
        questionText={currentQuestion.question_text}
        options={currentQuestion.options}
        initialMode={aiModalMode}
        correctOptionText={
          currentQuestion.options.find(
            (o: any) => o.is_correct === 1 || o.is_correct === true || String(o.is_correct) === '1' || String(o.is_correct) === 'true'
          )?.option_text
        }
        selectedOptionText={
          answers[currentQuestion.id]
            ? currentQuestion.options.find((o: any) => o.id === answers[currentQuestion.id])?.option_text
            : undefined
        }
        quizTitle={quizInfo?.title}
      />
    </div>
  );
}
