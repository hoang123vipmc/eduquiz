import React, { useState } from 'react';
import { X, CheckCircle2, Clock, Settings, HelpCircle, EyeOff, Monitor, Sparkles, Sliders } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface QuizConfig {
  examMode: 'practice' | 'exam';
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  autoNextDelay: string;
  unlimitedTime: boolean;
  questionLimit: number; // 0 = all
  theme: 'modern' | 'itest';
}

interface QuizSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: QuizConfig) => void;
  quizTitle?: string;
  totalQuestions?: number;
}

export function QuizSettingsModal({ isOpen, onClose, onConfirm, quizTitle, totalQuestions }: QuizSettingsModalProps) {
  const [examMode, setExamMode] = useState<'practice' | 'exam'>('practice');
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [autoNextDelay, setAutoNextDelay] = useState('2s');
  const [unlimitedTime, setUnlimitedTime] = useState(false);
  const [questionCountType, setQuestionCountType] = useState<'all' | '40' | '60' | '120' | 'custom'>('all');
  const [customCount, setCustomCount] = useState<number>(60);
  const [theme, setTheme] = useState<'modern' | 'itest'>('modern');

  // Tự động bật không giới hạn thời gian nếu là ôn thi
  React.useEffect(() => {
    if (examMode === 'practice') {
      setUnlimitedTime(true);
    } else {
      setUnlimitedTime(false);
    }
  }, [examMode]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    let finalLimit = 0;
    if (questionCountType === '40') finalLimit = 40;
    else if (questionCountType === '60') finalLimit = 60;
    else if (questionCountType === '120') finalLimit = 120;
    else if (questionCountType === 'custom') finalLimit = Math.max(1, customCount || 10);

    onConfirm({
      examMode,
      shuffleQuestions,
      shuffleOptions,
      autoNextDelay,
      unlimitedTime,
      questionLimit: finalLimit,
      theme
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-card rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-border max-h-[92vh]">
        
        {/* Header */}
        <div className="relative flex items-center justify-between p-4 border-b border-border bg-secondary/30 shrink-0">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-primary" />
            <h2 className="text-foreground font-bold text-base sm:text-lg">Cài đặt phòng thi</h2>
          </div>
          <button 
            onClick={onClose}
            aria-label="Đóng"
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-5 overflow-y-auto">
          {quizTitle && (
            <div className="text-center bg-muted/40 p-2.5 rounded-xl border border-border/60">
              <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider block mb-0.5">Đề thi đang chọn</span>
              <p className="text-foreground font-semibold text-sm truncate" title={quizTitle}>
                {quizTitle}
              </p>
            </div>
          )}

          {/* Khu vực 1: Giao diện phòng thi */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-foreground text-sm font-semibold flex items-center gap-1.5">
                <Monitor className="w-4 h-4 text-primary" />
                Giao diện làm bài
              </label>
              <span className="text-xs text-muted-foreground font-medium">Có thể đổi khi đang thi</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div 
                onClick={() => setTheme('modern')}
                className={cn(
                  "p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-2 text-left relative",
                  theme === 'modern'
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border hover:border-border/80 hover:bg-muted/40"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-sm text-foreground">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span>EduQuiz Hiện đại</span>
                  </div>
                  {theme === 'modern' && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Giao diện trực quan, thẻ bo tròn mềm mại, hỗ trợ Dark Mode & hiệu ứng làm bài mượt mà.
                </p>
              </div>

              <div 
                onClick={() => setTheme('itest')}
                className={cn(
                  "p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-2 text-left relative",
                  theme === 'itest'
                    ? "border-amber-500 bg-amber-500/10 shadow-sm"
                    : "border-border hover:border-border/80 hover:bg-muted/40"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-sm text-foreground">
                    <span className="text-amber-500 font-mono font-black text-xs px-1.5 py-0.5 rounded bg-amber-500/20">iTest</span>
                    <span>Chuẩn Trường thi</span>
                  </div>
                  {theme === 'itest' && <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />}
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Mô phỏng 100% phòng máy iTest v12: vạch kẻ Câu hỏi/Trả lời, thẻ SV, phím tắt A-B-C-D.
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-border/80" />

          {/* Khu vực 2: Số lượng câu hỏi */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-foreground text-sm font-semibold flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-primary" />
                Số lượng câu hỏi
              </label>
              {totalQuestions && (
                <span className="text-xs text-muted-foreground font-medium">
                  Ngân hàng: {totalQuestions} câu
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setQuestionCountType('all')}
                className={cn(
                  "py-2 px-2 text-xs font-semibold rounded-xl border transition-all text-center",
                  questionCountType === 'all'
                    ? "border-primary bg-primary text-primary-foreground shadow-xs font-bold"
                    : "border-border bg-card text-foreground hover:bg-muted"
                )}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setQuestionCountType('40')}
                className={cn(
                  "py-2 px-2 text-xs font-semibold rounded-xl border transition-all text-center",
                  questionCountType === '40'
                    ? "border-primary bg-primary text-primary-foreground shadow-xs font-bold"
                    : "border-border bg-card text-foreground hover:bg-muted"
                )}
              >
                40 câu
              </button>
              <button
                type="button"
                onClick={() => setQuestionCountType('60')}
                className={cn(
                  "py-2 px-2 text-xs font-semibold rounded-xl border transition-all text-center relative",
                  questionCountType === '60'
                    ? "border-primary bg-primary text-primary-foreground shadow-xs font-bold"
                    : "border-border bg-card text-foreground hover:bg-muted"
                )}
              >
                60 câu
                <span className="absolute -top-1.5 -right-1 bg-amber-500 text-white text-[9px] px-1 rounded-full font-bold">
                  Thi
                </span>
              </button>
              <button
                type="button"
                onClick={() => setQuestionCountType('120')}
                className={cn(
                  "py-2 px-2 text-xs font-semibold rounded-xl border transition-all text-center",
                  questionCountType === '120'
                    ? "border-primary bg-primary text-primary-foreground shadow-xs font-bold"
                    : "border-border bg-card text-foreground hover:bg-muted"
                )}
              >
                120 câu
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setQuestionCountType('custom')}
                className={cn(
                  "py-1.5 px-3 text-xs font-semibold rounded-lg border transition-all shrink-0",
                  questionCountType === 'custom'
                    ? "border-primary bg-primary/10 text-primary font-bold"
                    : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                Tùy chỉnh số câu
              </button>
              {questionCountType === 'custom' && (
                <div className="flex items-center gap-2 flex-1 animate-in fade-in duration-150">
                  <input
                    type="number"
                    min={1}
                    max={totalQuestions || 500}
                    value={customCount}
                    onChange={(e) => setCustomCount(Math.max(1, parseInt(e.target.value) || 1))}
                    aria-label="Số lượng câu hỏi tùy chỉnh"
                    className="w-24 px-3 py-1.5 text-xs bg-secondary border border-border rounded-lg text-foreground font-semibold outline-none focus:border-primary"
                  />
                  <span className="text-xs text-muted-foreground">câu ngẫu nhiên từ ngân hàng</span>
                </div>
              )}
            </div>
          </div>

          <div className="border-b border-border/80" />

          {/* Khu vực 3: Chọn chế độ (Radio Group) */}
          <div className="space-y-3">
            <label className="text-foreground text-sm font-semibold flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary" />
              Chế độ làm bài
            </label>
            <div className="flex gap-3">
              <label className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border-2 cursor-pointer transition-all",
                examMode === 'practice' 
                  ? "border-[#4F7CFF] bg-[#4F7CFF]/10 text-foreground font-semibold" 
                  : "border-border text-muted-foreground hover:border-border/80 hover:bg-muted/40"
              )}>
                <input 
                  type="radio" 
                  className="hidden" 
                  checked={examMode === 'practice'} 
                  onChange={() => setExamMode('practice')} 
                />
                <div className={cn(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                  examMode === 'practice' ? "border-[#4F7CFF]" : "border-muted-foreground"
                )}>
                  {examMode === 'practice' && <div className="w-2 h-2 rounded-full bg-[#4F7CFF]" />}
                </div>
                <span className="text-sm">Ôn thi</span>
              </label>

              <label className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border-2 cursor-pointer transition-all",
                examMode === 'exam' 
                  ? "border-[#4F7CFF] bg-[#4F7CFF]/10 text-foreground font-semibold" 
                  : "border-border text-muted-foreground hover:border-border/80 hover:bg-muted/40"
              )}>
                <input 
                  type="radio" 
                  className="hidden" 
                  checked={examMode === 'exam'} 
                  onChange={() => setExamMode('exam')} 
                />
                <div className={cn(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                  examMode === 'exam' ? "border-[#4F7CFF]" : "border-muted-foreground"
                )}>
                  {examMode === 'exam' && <div className="w-2 h-2 rounded-full bg-[#4F7CFF]" />}
                </div>
                <span className="text-sm">Thi thử</span>
              </label>
            </div>

            {/* Giải thích tính năng */}
            <div className="bg-muted/50 rounded-xl p-3 space-y-2 border border-border">
              {examMode === 'practice' ? (
                <>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-foreground/90 text-xs">Không giới hạn thời gian làm đề thi</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-foreground/90 text-xs">Hiển thị ngay đáp án đúng/sai & giải thích sau khi chọn</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <span className="text-foreground/90 text-xs">Đếm ngược thời gian làm bài nghiêm ngặt theo chuẩn đề</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <EyeOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <span className="text-foreground/90 text-xs">Bảo mật đáp án: chỉ xem kết quả chi tiết sau khi nộp bài</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="border-b border-border/80" />

          {/* Khu vực 4: Cài đặt đề thi */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
              <Settings className="w-4 h-4 text-primary" />
              <h3>Cài đặt khác</h3>
            </div>
            
            <div className="flex gap-4">
              <label className="flex-1 flex items-center gap-2.5 cursor-pointer group">
                <div className={cn(
                  "w-4 h-4 flex items-center justify-center rounded border transition-colors",
                  shuffleQuestions ? "bg-[#4F7CFF] border-[#4F7CFF]" : "border-border group-hover:border-primary"
                )}>
                  {shuffleQuestions && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={shuffleQuestions} 
                  onChange={(e) => setShuffleQuestions(e.target.checked)} 
                />
                <span className="text-foreground text-xs select-none font-medium">Đảo câu hỏi</span>
              </label>

              <label className="flex-1 flex items-center gap-2.5 cursor-pointer group">
                <div className={cn(
                  "w-4 h-4 flex items-center justify-center rounded border transition-colors",
                  shuffleOptions ? "bg-[#4F7CFF] border-[#4F7CFF]" : "border-border group-hover:border-primary"
                )}>
                  {shuffleOptions && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={shuffleOptions} 
                  onChange={(e) => setShuffleOptions(e.target.checked)} 
                />
                <span className="text-foreground text-xs select-none font-medium">Đảo đáp án</span>
              </label>
            </div>

            {/* Không giới hạn thời gian */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-foreground text-xs select-none font-medium">Không giới hạn thời gian</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={unlimitedTime} 
                  onChange={(e) => setUnlimitedTime(e.target.checked)} 
                />
                <div className="w-10 h-5 bg-muted border border-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#4F7CFF]"></div>
              </label>
            </div>

            {/* Tự động chuyển câu */}
            <div className="flex items-center justify-between pt-1">
              <label className="text-foreground text-xs font-medium">Tự động chuyển câu</label>
              <select 
                value={autoNextDelay}
                onChange={(e) => setAutoNextDelay(e.target.value)}
                aria-label="Thời gian tự động chuyển câu"
                className="bg-secondary border border-border text-foreground text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-[#4F7CFF] transition-colors"
              >
                <option value="off">Tắt</option>
                <option value="1s">1 giây</option>
                <option value="2s">2 giây</option>
                <option value="3s">3 giây</option>
                <option value="4s">4 giây</option>
                <option value="5s">5 giây</option>
              </select>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-secondary/20 shrink-0">
          <button 
            onClick={handleConfirm}
            className="w-full bg-[#4F7CFF] hover:bg-[#6D91FF] text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 active:scale-[0.98] text-sm"
          >
            {theme === 'itest' ? '🏫 Vào phòng thi iTest' : '🚀 Bắt đầu làm bài'}
          </button>
        </div>

      </div>
    </div>
  );
}
