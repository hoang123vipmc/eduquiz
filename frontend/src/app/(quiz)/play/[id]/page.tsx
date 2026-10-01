"use client";

import React, { useEffect, useState, useMemo } from "react";
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
  Monitor, 
  Sparkles, 
  LayoutGrid,
  Maximize2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatQuizDuration } from "@/lib/utils/time";
import { FormattedText, cleanOptionPrefix } from "@/components/quiz/FormattedText";

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
  const [quizInfo, setQuizInfo] = useState<{ title: string; category?: string } | null>(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [autoNextDelay, setAutoNextDelay] = useState(0);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});

  const toggleFlagCurrent = () => {
    const q = questions[currentQuestionIndex];
    if (!q) return;
    setFlaggedQuestions(prev => ({
      ...prev,
      [q.id]: !prev[q.id]
    }));
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
          autoNextDelay: Number(params.get('delay')) || 0,
          unlimitedTime: params.get('unlimited') === '1' || modeParam === 'practice' || !modeParam,
          questionLimit: limitParam
        };
        setAutoNextDelay(config.autoNextDelay);
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

  const handleSubmit = async (isAutoTimeout = false) => {
    if (submitting) return;

    if (!isAutoTimeout) {
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
  // =========================================================================
  if (theme === 'itest') {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const currentAnsId = answers[currentQuestion.id];

    return (
      <div className="fixed inset-0 flex flex-col bg-[#e2e8f0] text-[#1e293b] z-50 overflow-hidden font-sans select-none">
        
        {/* Thanh tiêu đề giả lập cửa sổ Windows iTest */}
        <div className="h-7 bg-[#0b2447] text-white flex items-center justify-between px-3 text-xs shrink-0 border-b border-[#19376d]">
          <div className="flex items-center gap-2 font-mono text-[11px] truncate">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
            <span className="font-bold tracking-wider">TRẮC NGHIỆM :: Hệ thống khảo sát & đánh giá chất lượng iTest</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme('modern')}
              title="Đổi sang giao diện EduQuiz hiện đại"
              className="px-2 py-0.5 rounded bg-blue-800 hover:bg-blue-700 text-[10px] text-white flex items-center gap-1 font-sans"
            >
              <Sparkles className="w-3 h-3 text-yellow-400" />
              <span>Giao diện Hiện đại</span>
            </button>
            <button
              onClick={handleExit}
              title="Đóng phòng thi"
              className="text-gray-300 hover:text-white px-1.5 hover:bg-red-600 rounded"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Thanh Header chính: Dark Navy với Chữ Vàng Rực Rỡ như ảnh chụp */}
        <div className="h-12 bg-[#122846] border-b-2 border-[#facc15]/80 flex items-center justify-between px-4 shrink-0 shadow-md">
          <div className="flex items-center gap-2">
            <span className="text-[#facc15] font-black text-lg md:text-xl tracking-wider uppercase font-mono drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              PHÒNG THI : 12
            </span>
          </div>

          <div className="text-center truncate px-2">
            <span className="text-[#facc15] font-black text-base md:text-xl tracking-wider uppercase font-sans drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              MÔN {quizInfo?.title ? quizInfo.title.toUpperCase() : "CÔNG NGHỆ THÔNG TIN"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowQuestionPalette(true)}
              className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold px-3 py-1.5 rounded shadow-sm flex items-center gap-1.5"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bảng câu hỏi</span>
            </button>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-black px-3.5 py-1.5 rounded shadow-sm tracking-wide disabled:opacity-50"
            >
              {submitting ? "Đang nộp..." : "Nộp bài thi"}
            </button>
          </div>
        </div>

        {/* Nội dung trung tâm: Cột thông tin Sinh viên (Trái) & Trang giấy đề thi (Phải) */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* CỘT TRÁI: Thẻ Sinh Viên & Thông số iTest */}
          <aside className="w-56 md:w-64 bg-[#d0d7de] border-r border-[#9aa5b1] flex flex-col p-3 text-[#111827] text-xs shrink-0 select-text overflow-y-auto">
            
            {/* Ảnh thẻ 3x4 sinh viên chuẩn phông xanh */}
            <div className="flex justify-center mb-3">
              <div className="w-[100px] h-[130px] bg-[#1d4ed8] border-2 border-white shadow-md rounded-xs overflow-hidden flex flex-col items-center justify-center relative">
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt="Ảnh thí sinh" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white bg-gradient-to-b from-[#2563eb] to-[#1e40af]">
                    <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center mb-2 font-bold text-base">
                      {studentName.charAt(0)}
                    </div>
                    <span className="text-[10px] font-mono opacity-80 uppercase tracking-tighter">THÍ SINH</span>
                  </div>
                )}
              </div>
            </div>

            {/* Thông tin thí sinh chuẩn mẫu iTest */}
            <div className="space-y-1 font-mono text-[12px] pb-3 border-b border-dashed border-[#64748b]">
              <div className="truncate"><span className="text-[#475569]">Mã SV:</span> <strong className="font-bold">{studentCode}</strong></div>
              <div className="truncate"><span className="text-[#475569]">Họ tên:</span> <strong className="font-bold">{studentName}</strong></div>
              <div><span className="text-[#475569]">Ngày sinh:</span> 13/12/2005</div>
              <div><span className="text-[#475569]">Lớp:</span> D18-CNTT04</div>
              <div className="text-[11px] text-[#475569] pt-0.5">{examDateStr}</div>
            </div>

            {/* Thông số câu hỏi & Thời gian đếm ngược */}
            <div className="py-3 space-y-2 font-mono border-b border-dashed border-[#64748b]">
              <div className="text-sm font-black text-[#0f172a]">
                Câu: <span className="text-blue-700">{currentQuestionIndex + 1}</span>/ {questions.length}
              </div>
              <div className="text-xs font-bold text-[#b91c1c] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Làm bài còn: {timerMinutes}' {timerSeconds < 10 ? `0${timerSeconds}` : timerSeconds}"</span>
              </div>
            </div>

            {/* Cờ đánh dấu câu hỏi xem lại */}
            <div className="py-2.5">
              <button
                type="button"
                onClick={toggleFlagCurrent}
                className={cn(
                  "w-full py-1.5 px-2 rounded border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors",
                  flaggedQuestions[currentQuestion.id]
                    ? "bg-amber-100 text-amber-800 border-amber-400 font-bold"
                    : "bg-white/80 hover:bg-white text-gray-700 border-gray-400"
                )}
              >
                <Flag className={cn("w-3.5 h-3.5", flaggedQuestions[currentQuestion.id] && "fill-amber-600 text-amber-600")} />
                <span>{flaggedQuestions[currentQuestion.id] ? "Đã đánh dấu xem lại" : "Đánh dấu xem lại"}</span>
              </button>
            </div>

            {/* Watermark v12.2025 ở góc dưới */}
            <div className="mt-auto pt-3 text-[11px] font-mono text-[#64748b] tracking-wider text-center">
              iTest v12.2025
            </div>
          </aside>

          {/* CỘT PHẢI: Khung giấy thi (Times New Roman / Serif, có vạch :: Câu hỏi :: và :: Trả lời ::) */}
          <main className="flex-1 flex flex-col bg-[#ffffff] overflow-hidden">
            
            {/* Vùng cuộn đọc đề thi */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 font-serif text-[#111827] select-text">
              
              {/* Vạch kẻ phân đoạn :: Câu hỏi :: */}
              <div className="flex items-center justify-center my-2 text-xs md:text-sm text-[#475569] font-mono">
                <span className="text-[#94a3b8] tracking-widest hidden sm:inline">---------------------------</span>
                <span className="px-3 font-bold text-[#334155]">:: Câu hỏi ::</span>
                <span className="text-[#94a3b8] tracking-widest hidden sm:inline">---------------------------</span>
              </div>

              {/* Nội dung câu hỏi (Serif, giữ nguyên thụt dòng code) */}
              <div className="text-[16px] md:text-[17px] leading-relaxed my-4 text-[#000000] font-serif whitespace-pre-wrap">
                <FormattedText text={currentQuestion.question_text} />
              </div>

              {/* Vạch kẻ phân đoạn :: Trả lời :: */}
              <div className="flex items-center justify-center my-6 text-xs md:text-sm text-[#475569] font-mono">
                <span className="text-[#94a3b8] tracking-widest hidden sm:inline">---------------------------</span>
                <span className="px-3 font-bold text-[#334155]">:: Trả lời ::</span>
                <span className="text-[#94a3b8] tracking-widest hidden sm:inline">---------------------------</span>
              </div>

              {/* Danh sách lựa chọn A, B, C, D */}
              <div className="space-y-3 font-serif text-[15px] md:text-[16px] max-w-4xl">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = currentAnsId === option.id;
                  const hasAnswered = !!currentAnsId;
                  const isCorrect = option.is_correct === 1 || option.is_correct === true || String(option.is_correct) === '1' || String(option.is_correct) === 'true';

                  let optHighlight = "hover:bg-blue-50/60";
                  if (isSelected) {
                    optHighlight = "bg-blue-100/80 font-semibold text-blue-900 border-l-4 border-blue-600 pl-2";
                  }

                  if (isPractice && hasAnswered) {
                    if (isCorrect) {
                      optHighlight = "bg-emerald-100 text-emerald-900 font-semibold border-l-4 border-emerald-600 pl-2";
                    } else if (isSelected && !isCorrect) {
                      optHighlight = "bg-rose-100 text-rose-900 font-semibold border-l-4 border-rose-600 pl-2";
                    }
                  }

                  return (
                    <div
                      key={option.id}
                      onClick={() => !hasAnswered && handleSelectOption(option.id)}
                      className={cn(
                        "py-2 px-3 rounded transition-colors cursor-pointer flex items-baseline gap-2 leading-relaxed",
                        optHighlight
                      )}
                    >
                      <span className="font-bold text-[#1e293b] font-mono shrink-0">
                        {letters[idx]})
                      </span>
                      <div className="flex-1 break-words">
                        <FormattedText text={cleanOptionPrefix(option.option_text)} />
                      </div>
                      {isPractice && hasAnswered && isCorrect && (
                        <span className="text-xs bg-emerald-600 text-white font-sans px-2 py-0.5 rounded font-bold shrink-0">
                          Đáp án đúng
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Giải thích chi tiết nếu là chế độ ôn thi và đã trả lời */}
              {isPractice && currentAnsId && currentQuestion.options.some(o => o.id === currentAnsId) && (
                <div className="mt-6 p-4 rounded bg-amber-50 border border-amber-200 text-xs md:text-sm font-sans text-amber-900">
                  <div className="font-bold mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Giải thích đáp án:</span>
                  </div>
                  <p className="leading-relaxed">
                    Hệ thống đã ghi nhận lựa chọn của bạn. Nhấn <strong>Câu sau</strong> để tiếp tục hoặc chọn câu khác trong bảng.
                  </p>
                </div>
              )}
            </div>

            {/* THANH ĐIỀU KHIỂN DƯỚI: Các nút lớn [ A ] [ B ] [ C ] [ D ] và Nút Chuyển Câu */}
            <div className="h-16 bg-[#e2e8f0] border-t border-[#cbd5e1] px-4 flex items-center justify-between shrink-0 shadow-inner">
              
              {/* Nút mở Bảng câu hỏi */}
              <button
                type="button"
                onClick={() => setShowQuestionPalette(true)}
                className="px-3 py-2 bg-white hover:bg-gray-100 text-gray-800 text-xs font-bold rounded border border-gray-400 shadow-xs flex items-center gap-1.5"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bảng câu hỏi</span>
              </button>

              {/* 4 Nút to chọn đáp án [ A ] [ B ] [ C ] [ D ] đặc trưng của iTest */}
              <div className="flex items-center gap-2 sm:gap-3">
                {['A', 'B', 'C', 'D'].map((letter, idx) => {
                  const opt = currentQuestion.options[idx];
                  if (!opt) return null;
                  const isSelected = currentAnsId === opt.id;

                  return (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => handleSelectOption(opt.id)}
                      title={`Bấm phím ${letter} trên bàn phím để chọn`}
                      className={cn(
                        "w-11 sm:w-14 h-10 rounded font-mono font-black text-sm sm:text-base border-2 transition-all flex items-center justify-center shadow-xs active:scale-95",
                        isSelected
                          ? "bg-[#1e3a8a] text-white border-[#1e3a8a] ring-2 ring-blue-400 shadow-md"
                          : "bg-white text-gray-800 border-gray-400 hover:bg-gray-100 hover:border-gray-500"
                      )}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>

              {/* Điều hướng chuyển câu Trước / Sau */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                  className="px-2.5 sm:px-3.5 py-2 bg-white hover:bg-gray-100 text-gray-800 text-xs font-bold rounded border border-gray-400 disabled:opacity-40 shadow-xs flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden md:inline">Câu trước</span>
                </button>
                <button
                  disabled={currentQuestionIndex === questions.length - 1}
                  onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                  className="px-2.5 sm:px-3.5 py-2 bg-[#1e40af] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded shadow-xs flex items-center gap-1 disabled:opacity-40"
                >
                  <span className="hidden md:inline">Câu sau</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </div>

          </main>
        </div>

        {/* Modal Bảng câu hỏi (Question Grid Palette) cho iTest */}
        {showQuestionPalette && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-gray-300 overflow-hidden flex flex-col max-h-[85vh]">
              
              <div className="bg-[#122846] text-white px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold font-mono">
                  <LayoutGrid className="w-4 h-4 text-yellow-400" />
                  <span>BẢNG CÂU HỎI ({Object.keys(answers).length}/{questions.length} đã làm)</span>
                </div>
                <button
                  onClick={() => setShowQuestionPalette(false)}
                  className="text-gray-300 hover:text-white p-1 hover:bg-white/10 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto flex-1 bg-gray-50">
                <div className="grid grid-cols-6 sm:grid-cols-10 gap-2 font-mono">
                  {questions.map((q, idx) => {
                    const isAnswered = !!answers[q.id];
                    const isCurrent = currentQuestionIndex === idx;
                    const isFlagged = !!flaggedQuestions[q.id];

                    let colorClass = "bg-white text-gray-700 border-gray-300 hover:bg-gray-100";
                    if (isAnswered) {
                      colorClass = "bg-blue-600 text-white border-blue-700 font-bold";
                    }
                    if (isCurrent) {
                      colorClass += " ring-2 ring-yellow-400 ring-offset-1";
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
                          "h-10 rounded border flex items-center justify-center text-xs relative font-semibold transition-all",
                          colorClass
                        )}
                      >
                        {idx + 1}
                        {isFlagged && (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 text-white rounded-full flex items-center justify-center text-[8px]">
                            ⚑
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 bg-gray-100 border-t border-gray-300 flex items-center justify-between text-xs text-gray-600 font-mono">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-blue-600 rounded"></span> Đã làm
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-white border border-gray-300 rounded"></span> Chưa làm
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-amber-500 rounded"></span> Đánh dấu
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuestionPalette(false)}
                  className="px-4 py-1.5 bg-gray-800 text-white font-sans font-bold rounded text-xs hover:bg-gray-700"
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
  // GIAO DIỆN 2: EDUQUIZ HIỆN ĐẠI (MODERN UI)
  // =========================================================================
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
              {quizInfo?.title ? quizInfo.title : `Đang làm bài #${id}`}
            </h1>
          </div>
          
          <div className="flex items-center gap-2.5 md:gap-4">
            {/* Nút chuyển đổi nhanh sang iTest Theme */}
            <button
              onClick={() => setTheme('itest')}
              title="Chuyển sang giao diện mô phỏng phòng thi iTest của trường"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs hover:bg-amber-500/20 transition-all shadow-xs"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Chuẩn iTest</span>
            </button>

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
        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none opacity-40" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)' }}></div>

        {/* LEFT/CENTER: Question Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 relative z-10 scrollbar-hide">
          <div 
            key={currentQuestion.id}
            className="max-w-4xl mx-auto flex flex-col min-h-full animate-in fade-in slide-in-from-right-3 duration-200 ease-out motion-reduce:animate-none"
          >
            <div className="flex items-center justify-between text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-6">
              <div className="flex items-center gap-3">
                <span>Câu hỏi {currentQuestionIndex + 1} / {questions.length}</span>
                <button
                  type="button"
                  onClick={toggleFlagCurrent}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-xs",
                    flaggedQuestions[currentQuestion.id]
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40 shadow-amber-500/10"
                      : "bg-muted text-muted-foreground border-border hover:text-foreground hover:bg-muted/80"
                  )}
                  title="Đánh dấu câu hỏi này để xem lại trước khi nộp bài"
                >
                  <Flag className={cn("w-3.5 h-3.5", flaggedQuestions[currentQuestion.id] && "fill-amber-500 text-amber-500")} />
                  <span>{flaggedQuestions[currentQuestion.id] ? "Đã đánh dấu" : "Đánh dấu xem lại"}</span>
                </button>
              </div>
              <span className="bg-muted px-3 py-1 rounded-full border border-border text-primary font-bold">1 Điểm</span>
            </div>
            
            <div className="bg-card rounded-[20px] border border-border p-6 md:p-10 shadow-xs mb-6 shrink-0">
              <h2 className="text-[20px] md:text-[24px] font-semibold leading-[1.6] text-foreground break-words">
                <FormattedText text={currentQuestion.question_text} />
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
                      <FormattedText text={cleanOptionPrefix(option.option_text)} />
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
                  } catch (e) {
                    console.error("Lỗi xóa câu sai:", e);
                    alert("Có lỗi khi làm mới các câu sai. Vui lòng thử lại.");
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
                    isFlagged={!!flaggedQuestions[q.id]}
                    onSelect={setCurrentQuestionIndex}
                  />
                );
              })}
            </div>
          </div>
          
          {/* Navigator Footer Stats */}
          <div className="p-4 md:p-6 border-t border-border bg-card/80 grid grid-cols-3 gap-2 text-sm font-medium shrink-0">
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-[11px] uppercase tracking-wider">Đã làm</span>
              <span className="text-foreground text-lg">{Object.keys(answers).length}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-[11px] uppercase tracking-wider">Đánh dấu</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold text-lg">
                {Object.values(flaggedQuestions).filter(Boolean).length}
              </span>
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
