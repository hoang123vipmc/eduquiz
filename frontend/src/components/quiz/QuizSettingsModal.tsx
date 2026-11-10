import React, { useState } from 'react';
import { X, CheckCircle2, Clock, Settings, HelpCircle, EyeOff, Monitor, Sparkles, Sliders, Share2, Play } from 'lucide-react';
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
  quizId?: number;
  quizTitle?: string;
  totalQuestions?: number;
}

export function QuizSettingsModal({ isOpen, onClose, onConfirm, quizId, quizTitle, totalQuestions }: QuizSettingsModalProps) {
  const [examMode, setExamMode] = useState<'practice' | 'exam'>('practice');
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [autoNextDelay, setAutoNextDelay] = useState('2s');
  const [unlimitedTime, setUnlimitedTime] = useState(false);
  const [questionCountType, setQuestionCountType] = useState<'all' | '40' | '60' | '120' | 'custom'>('all');
  const [customCount, setCustomCount] = useState<number>(60);
  const [theme, setTheme] = useState<'modern' | 'itest'>('modern');
  const [copied, setCopied] = useState(false);

  const handleCopyShareLink = () => {
    if (!quizId) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://openquiz-free.vercel.app';
    let finalLimit = 0;
    if (questionCountType === '40') finalLimit = 40;
    else if (questionCountType === '60') finalLimit = 60;
    else if (questionCountType === '120') finalLimit = 120;
    else if (questionCountType === 'custom') finalLimit = Math.max(1, customCount || 10);

    const shareUrl = `${origin}/play/${quizId}?mode=${examMode}&shuffleQ=${shuffleQuestions ? '1' : '0'}&shuffleO=${shuffleOptions ? '1' : '0'}&delay=${autoNextDelay}&unlimited=${unlimitedTime ? '1' : '0'}&theme=${theme}${finalLimit > 0 ? `&limit=${finalLimit}` : ''}`;

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-card rounded-xl shadow-2xl overflow-hidden flex flex-col border border-border max-h-[92vh]">
        
        {/* Header */}
        <div className="relative flex items-center justify-between px-5 py-3.5 border-b border-border bg-secondary/30 shrink-0">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-primary" />
            <h2 className="text-foreground font-semibold text-sm sm:text-base">Cấu hình phòng thi</h2>
          </div>
          <button 
            onClick={onClose}
            aria-label="Đóng"
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-5 overflow-y-auto">
          {quizTitle && (
            <div className="bg-secondary/40 px-3.5 py-2.5 rounded-lg border border-border">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block mb-0.5">Học phần đã chọn</span>
              <p className="text-foreground font-semibold text-xs sm:text-sm truncate" title={quizTitle}>
                {quizTitle}
              </p>
            </div>
          )}

          {/* Section 1: Theme */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-foreground text-xs sm:text-sm font-semibold flex items-center gap-1.5">
                <Monitor className="w-4 h-4 text-primary" />
                <span>Giao diện làm bài</span>
              </label>
              <span className="text-[11px] text-muted-foreground">Có thể chuyển đổi khi đang thi</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div 
                onClick={() => setTheme('modern')}
                className={cn(
                  "p-3 rounded-lg border cursor-pointer transition-all flex flex-col justify-between gap-1.5 text-left relative",
                  theme === 'modern'
                    ? "border-primary bg-primary/[0.04]"
                    : "border-border hover:bg-secondary/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-xs sm:text-sm text-foreground">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>OpenQuiz Modern</span>
                  </div>
                  {theme === 'modern' && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Giao diện SaaS tối giản, hỗ trợ phím tắt, Dark Mode và trợ lý phân tích AI.
                </p>
              </div>

              <div 
                onClick={() => setTheme('itest')}
                className={cn(
                  "p-3 rounded-lg border cursor-pointer transition-all flex flex-col justify-between gap-1.5 text-left relative",
                  theme === 'itest'
                    ? "border-primary bg-primary/[0.04]"
                    : "border-border hover:bg-secondary/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-xs sm:text-sm text-foreground">
                    <span className="text-primary font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">iTest</span>
                    <span>Chuẩn Phòng Máy</span>
                  </div>
                  {theme === 'itest' && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Mô phỏng 100% phần mềm thi iTest của trường: thẻ sinh viên, lưới câu hỏi thực tế.
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-border" />

          {/* Section 2: Question Count */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-foreground text-xs sm:text-sm font-semibold flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-primary" />
                <span>Số lượng câu hỏi</span>
              </label>
              {totalQuestions && (
                <span className="text-xs font-mono text-muted-foreground tabular-nums">
                  Tổng: {totalQuestions} câu
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              {(['all', '40', '60', '120'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setQuestionCountType(type)}
                  className={cn(
                    "py-2 px-2 text-xs font-medium rounded-lg border transition-colors text-center relative cursor-pointer tabular-nums",
                    questionCountType === type
                      ? "border-primary bg-primary text-primary-foreground font-semibold"
                      : "border-border bg-card text-foreground hover:bg-secondary"
                  )}
                >
                  {type === 'all' ? 'Tất cả' : `${type} câu`}
                  {type === '60' && (
                    <span className="absolute -top-1.5 -right-1 bg-foreground text-background text-[9px] font-mono px-1 rounded font-semibold">
                      Chuẩn
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setQuestionCountType('custom')}
                className={cn(
                  "py-1.5 px-3 text-xs font-medium rounded-lg border transition-colors shrink-0 cursor-pointer",
                  questionCountType === 'custom'
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
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
                    className="w-24 px-2.5 py-1.5 text-xs font-mono bg-card border border-border rounded-lg text-foreground font-semibold outline-none focus:border-primary tabular-nums"
                  />
                  <span className="text-xs text-muted-foreground">câu ngẫu nhiên</span>
                </div>
              )}
            </div>
          </div>

          <div className="border-b border-border" />

          {/* Section 3: Mode */}
          <div className="space-y-3">
            <label className="text-foreground text-xs sm:text-sm font-semibold flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary" />
              <span>Chế độ làm bài</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <label className={cn(
                "flex items-center justify-center gap-2 py-2 px-3 rounded-lg border cursor-pointer transition-colors",
                examMode === 'practice' 
                  ? "border-primary bg-primary/[0.06] text-foreground font-semibold" 
                  : "border-border text-muted-foreground hover:bg-secondary/50"
              )}>
                <input 
                  type="radio" 
                  className="hidden" 
                  checked={examMode === 'practice'} 
                  onChange={() => setExamMode('practice')} 
                />
                <div className={cn(
                  "w-3.5 h-3.5 rounded-full border flex items-center justify-center",
                  examMode === 'practice' ? "border-primary" : "border-muted-foreground"
                )}>
                  {examMode === 'practice' && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <span className="text-xs sm:text-sm">Luyện tập (Ôn thi)</span>
              </label>

              <label className={cn(
                "flex items-center justify-center gap-2 py-2 px-3 rounded-lg border cursor-pointer transition-colors",
                examMode === 'exam' 
                  ? "border-primary bg-primary/[0.06] text-foreground font-semibold" 
                  : "border-border text-muted-foreground hover:bg-secondary/50"
              )}>
                <input 
                  type="radio" 
                  className="hidden" 
                  checked={examMode === 'exam'} 
                  onChange={() => setExamMode('exam')} 
                />
                <div className={cn(
                  "w-3.5 h-3.5 rounded-full border flex items-center justify-center",
                  examMode === 'exam' ? "border-primary" : "border-muted-foreground"
                )}>
                  {examMode === 'exam' && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <span className="text-xs sm:text-sm">Thi thử (Tính giờ)</span>
              </label>
            </div>

            <div className="bg-secondary/30 rounded-lg p-3 space-y-1.5 border border-border">
              {examMode === 'practice' ? (
                <>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground text-xs">Không giới hạn thời gian làm bài</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground text-xs">Hiển thị đáp án đúng/sai và giải thích ngay sau mỗi câu</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground text-xs">Đếm ngược thời gian nghiêm ngặt theo cấu trúc đề thi</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <EyeOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground text-xs">Ẩn đáp án trong lúc làm, chỉ công bố điểm sau khi nộp bài</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="border-b border-border" />

          {/* Section 4: Extra Options */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-foreground font-semibold text-xs sm:text-sm">
              <Settings className="w-4 h-4 text-primary" />
              <h3>Tùy chọn nâng cao</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className={cn(
                  "w-4 h-4 flex items-center justify-center rounded border transition-colors",
                  shuffleQuestions ? "bg-primary border-primary" : "border-border group-hover:border-primary"
                )}>
                  {shuffleQuestions && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={shuffleQuestions} 
                  onChange={(e) => setShuffleQuestions(e.target.checked)} 
                />
                <span className="text-foreground text-xs select-none font-medium">Đảo thứ tự câu hỏi</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer group">
                <div className={cn(
                  "w-4 h-4 flex items-center justify-center rounded border transition-colors",
                  shuffleOptions ? "bg-primary border-primary" : "border-border group-hover:border-primary"
                )}>
                  {shuffleOptions && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={shuffleOptions} 
                  onChange={(e) => setShuffleOptions(e.target.checked)} 
                />
                <span className="text-foreground text-xs select-none font-medium">Đảo vị trí đáp án</span>
              </label>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-foreground text-xs select-none font-medium">Không giới hạn thời gian</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={unlimitedTime} 
                  onChange={(e) => setUnlimitedTime(e.target.checked)} 
                />
                <div className="w-9 h-5 bg-secondary border border-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="text-foreground text-xs font-medium">Tự động chuyển câu</label>
              <select 
                value={autoNextDelay}
                onChange={(e) => setAutoNextDelay(e.target.value)}
                aria-label="Thời gian tự động chuyển câu"
                className="bg-card border border-border text-foreground text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-primary transition-colors cursor-pointer"
              >
                <option value="off">Tắt</option>
                <option value="1s">Sau 1 giây</option>
                <option value="2s">Sau 2 giây</option>
                <option value="3s">Sau 3 giây</option>
                <option value="4s">Sau 4 giây</option>
                <option value="5s">Sau 5 giây</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-secondary/20 shrink-0 space-y-2">
          <button 
            onClick={handleConfirm}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 rounded-lg transition-all active:scale-[0.99] text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{theme === 'itest' ? 'Vào phòng thi iTest' : 'Bắt đầu làm bài'}</span>
          </button>

          {quizId && (
            <button
              type="button"
              onClick={handleCopyShareLink}
              className="w-full py-2 px-3 rounded-lg border border-border bg-card hover:bg-secondary text-foreground text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Đã sao chép liên kết phòng thi</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Sao chép liên kết cấu hình đề thi</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
