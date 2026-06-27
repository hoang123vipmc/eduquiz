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
      <div className="w-full max-w-md bg-[#28282B] rounded-xl shadow-2xl overflow-hidden flex flex-col border border-gray-700/50">
        
        {/* Header */}
        <div className="relative flex items-center justify-center p-4 border-b border-gray-700/50">
          <h2 className="text-foreground font-bold text-lg">Chọn chế độ luyện thi</h2>
          <button 
            onClick={onClose}
            className="absolute right-4 p-1.5 text-gray-400 hover:text-foreground hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-6">
          {quizTitle && (
            <p className="text-center text-gray-300 font-medium truncate px-4" title={quizTitle}>
              {quizTitle}
            </p>
          )}

          {/* Khu vực 1: Chọn chế độ (Radio Group) */}
          <div className="space-y-4">
            <div className="flex gap-4">
              <label className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 cursor-pointer transition-all",
                examMode === 'practice' 
                  ? "border-blue-500 bg-blue-500/10 text-foreground" 
                  : "border-gray-600 text-gray-400 hover:border-gray-500"
              )}>
                <input 
                  type="radio" 
                  className="hidden" 
                  checked={examMode === 'practice'} 
                  onChange={() => setExamMode('practice')} 
                />
                <div className={cn(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                  examMode === 'practice' ? "border-blue-500" : "border-gray-500"
                )}>
                  {examMode === 'practice' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                </div>
                <span className="font-semibold">Ôn thi</span>
              </label>

              <label className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 cursor-pointer transition-all",
                examMode === 'exam' 
                  ? "border-blue-500 bg-blue-500/10 text-foreground" 
                  : "border-gray-600 text-gray-400 hover:border-gray-500"
              )}>
                <input 
                  type="radio" 
                  className="hidden" 
                  checked={examMode === 'exam'} 
                  onChange={() => setExamMode('exam')} 
                />
                <div className={cn(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                  examMode === 'exam' ? "border-blue-500" : "border-gray-500"
                )}>
                  {examMode === 'exam' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                </div>
                <span className="font-semibold">Thi thử</span>
              </label>
            </div>

            {/* Giải thích tính năng */}
            <div className="bg-[#1F1F22] rounded-lg p-4 space-y-3 border border-gray-700/50">
              {examMode === 'practice' ? (
                <>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">Không giới hạn thời gian làm đề thi</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">Hiển thị ngay đáp án sau khi chọn</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">Có đếm ngược thời gian làm bài nghiêm ngặt</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <EyeOff className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">Chỉ xem được đáp án sau khi nộp bài</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="border-b border-gray-600/50" />

          {/* Khu vực 2: Cài đặt đề thi */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-foreground font-medium">
              <Settings className="w-4 h-4 text-gray-400" />
              <h3>Cài đặt đề thi</h3>
            </div>
            <div className="flex gap-4">
              <label className="flex-1 flex items-center gap-3 cursor-pointer group">
                <div className={cn(
                  "w-5 h-5 flex items-center justify-center rounded border transition-colors",
                  shuffleQuestions ? "bg-blue-500 border-blue-500" : "border-gray-500 group-hover:border-gray-400"
                )}>
                  {shuffleQuestions && <CheckCircle2 className="w-3.5 h-3.5 text-foreground" />}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={shuffleQuestions} 
                  onChange={(e) => setShuffleQuestions(e.target.checked)} 
                />
                <span className="text-gray-300 text-sm select-none">Đảo câu hỏi</span>
              </label>

              <label className="flex-1 flex items-center gap-3 cursor-pointer group">
                <div className={cn(
                  "w-5 h-5 flex items-center justify-center rounded border transition-colors",
                  shuffleOptions ? "bg-blue-500 border-blue-500" : "border-gray-500 group-hover:border-gray-400"
                )}>
                  {shuffleOptions && <CheckCircle2 className="w-3.5 h-3.5 text-foreground" />}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={shuffleOptions} 
                  onChange={(e) => setShuffleOptions(e.target.checked)} 
                />
                <span className="text-gray-300 text-sm select-none">Đảo đáp án</span>
              </label>
            </div>

            {/* Không giới hạn thời gian */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-gray-300 text-sm select-none">Không giới hạn thời gian</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={unlimitedTime} 
                  onChange={(e) => setUnlimitedTime(e.target.checked)} 
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
          </div>

          {/* Khu vực 3: Tự động chuyển câu */}
          <div className="flex items-center justify-between">
            <label className="text-gray-300 text-sm">Tự động chuyển câu</label>
            <select 
              value={autoNextDelay}
              onChange={(e) => setAutoNextDelay(e.target.value)}
              className="bg-[#1F1F22] border border-gray-600 text-foreground text-sm rounded-md px-3 py-2 outline-none focus:border-blue-500 transition-colors"
            >
              <option value="off">Tắt</option>
              <option value="1s">1s</option>
              <option value="2s">2s</option>
              <option value="3s">3s</option>
              <option value="4s">4s</option>
              <option value="5s">5s</option>
            </select>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700/50">
          <button 
            onClick={handleConfirm}
            className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-foreground font-bold py-3.5 rounded-lg transition-colors shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
          >
            Xác nhận vào thi
          </button>
        </div>

      </div>
    </div>
  );
}
