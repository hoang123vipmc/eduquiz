import React, { useState } from 'react';
import { X, CheckCircle2, Clock, Settings, HelpCircle, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuizConfig {
  examMode: 'practice' | 'exam';
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  autoNextDelay: string;
  unlimitedTime: boolean;
}

interface QuizSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: QuizConfig) => void;
  quizTitle?: string;
}

export function QuizSettingsModal({ isOpen, onClose, onConfirm, quizTitle }: QuizSettingsModalProps) {
  const [examMode, setExamMode] = useState<'practice' | 'exam'>('practice');
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [autoNextDelay, setAutoNextDelay] = useState('2s');
  const [unlimitedTime, setUnlimitedTime] = useState(false);

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
    onConfirm({
      examMode,
      shuffleQuestions,
      shuffleOptions,
      autoNextDelay,
      unlimitedTime
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-border">
        
        {/* Header */}
        <div className="relative flex items-center justify-center p-4 border-b border-border bg-secondary/30">
          <h2 className="text-foreground font-bold text-lg">Chọn chế độ luyện thi</h2>
          <button 
            onClick={onClose}
            aria-label="Đóng"
            className="absolute right-4 p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-6">
          {quizTitle && (
            <p className="text-center text-muted-foreground font-medium truncate px-4" title={quizTitle}>
              {quizTitle}
            </p>
          )}

          {/* Khu vực 1: Chọn chế độ (Radio Group) */}
          <div className="space-y-4">
            <div className="flex gap-4">
              <label className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 cursor-pointer transition-all",
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
                <span>Ôn thi</span>
              </label>

              <label className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 cursor-pointer transition-all",
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
                <span>Thi thử</span>
              </label>
            </div>

            {/* Giải thích tính năng */}
            <div className="bg-muted/50 rounded-xl p-4 space-y-3 border border-border">
              {examMode === 'practice' ? (
                <>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-foreground/90 text-sm">Không giới hạn thời gian làm đề thi</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-foreground/90 text-sm">Hiển thị ngay đáp án và giải thích sau khi chọn</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <span className="text-foreground/90 text-sm">Có đếm ngược thời gian làm bài nghiêm ngặt</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <EyeOff className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <span className="text-foreground/90 text-sm">Chỉ xem được đáp án sau khi nộp bài</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="border-b border-border" />

          {/* Khu vực 2: Cài đặt đề thi */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
              <Settings className="w-4 h-4 text-primary" />
              <h3>Cài đặt đề thi</h3>
            </div>
            <div className="flex gap-4">
              <label className="flex-1 flex items-center gap-3 cursor-pointer group">
                <div className={cn(
                  "w-5 h-5 flex items-center justify-center rounded-md border transition-colors",
                  shuffleQuestions ? "bg-[#4F7CFF] border-[#4F7CFF]" : "border-border group-hover:border-primary"
                )}>
                  {shuffleQuestions && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={shuffleQuestions} 
                  onChange={(e) => setShuffleQuestions(e.target.checked)} 
                />
                <span className="text-foreground text-sm select-none">Đảo câu hỏi</span>
              </label>

              <label className="flex-1 flex items-center gap-3 cursor-pointer group">
                <div className={cn(
                  "w-5 h-5 flex items-center justify-center rounded-md border transition-colors",
                  shuffleOptions ? "bg-[#4F7CFF] border-[#4F7CFF]" : "border-border group-hover:border-primary"
                )}>
                  {shuffleOptions && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={shuffleOptions} 
                  onChange={(e) => setShuffleOptions(e.target.checked)} 
                />
                <span className="text-foreground text-sm select-none">Đảo đáp án</span>
              </label>
            </div>

            {/* Không giới hạn thời gian */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-foreground text-sm select-none font-medium">Không giới hạn thời gian</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={unlimitedTime} 
                  onChange={(e) => setUnlimitedTime(e.target.checked)} 
                />
                <div className="w-11 h-6 bg-muted border border-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4F7CFF]"></div>
              </label>
            </div>
          </div>

          {/* Khu vực 3: Tự động chuyển câu */}
          <div className="flex items-center justify-between">
            <label className="text-foreground text-sm font-medium">Tự động chuyển câu</label>
            <select 
              value={autoNextDelay}
              onChange={(e) => setAutoNextDelay(e.target.value)}
              aria-label="Thời gian tự động chuyển câu"
              className="bg-secondary border border-border text-foreground text-sm rounded-xl px-3 py-2 outline-none focus:border-[#4F7CFF] transition-colors"
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

        {/* Footer */}
        <div className="p-4 border-t border-border bg-secondary/20">
          <button 
            onClick={handleConfirm}
            className="w-full bg-[#4F7CFF] hover:bg-[#6D91FF] text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 active:scale-[0.98]"
          >
            Xác nhận vào thi
          </button>
        </div>

      </div>
    </div>
  );
}
