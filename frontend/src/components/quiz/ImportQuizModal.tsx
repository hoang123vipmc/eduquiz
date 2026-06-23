import React, { useState } from 'react';
import { X, Upload, FileText, Loader2, Edit3, ArrowLeft, HelpCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';
import { FormatGuideModal } from './FormatGuideModal';
import { parseQuizText } from '@/lib/utils/quizParser';

interface ImportQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (quiz: any) => void;
}

export function ImportQuizModal({ isOpen, onClose, onSuccess }: ImportQuizModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showGuide, setShowGuide] = useState(false);

  const parsedQuestions = React.useMemo(() => {
    if (step === 2) return parseQuizText(rawText);
    return [];
  }, [rawText, step]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (!selectedFile.name.endsWith('.docx')) {
        setError('Vui lòng chọn file Word (.docx)');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError('');
      
      if (!title) {
        setTitle(selectedFile.name.replace('.docx', ''));
      }
    }
  };

  const handleExtractText = async () => {
    if (!title.trim()) {
      setError('Vui lòng nhập tên đề thi');
      return;
    }
    if (!file) {
      setError('Vui lòng chọn file Word (.docx)');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const { data } = await api.post('/quizzes/extract-docx', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (data.success) {
        setRawText(data.text);
        setStep(2);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi đọc file Word.');
    } finally {
      setLoading(false);
    }
  };

  const handleImportText = async () => {
    if (!title.trim()) {
      setError('Vui lòng nhập tên đề thi');
      return;
    }
    if (!rawText.trim()) {
      setError('Nội dung đề thi không được để trống');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/quizzes/import-text', {
        title: title,
        text: rawText
      });
      
      if (data.success) {
        onSuccess(data.data);
        setTitle('');
        setFile(null);
        setRawText('');
        setStep(1);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo đề thi.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualText = () => {
    if (!title.trim()) {
      setError('Vui lòng nhập tên đề thi trước khi soạn thảo');
      return;
    }
    setFile(null);
    setRawText('');
    setStep(2);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={cn(
          "bg-[#0f172a] rounded-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-white/10 overflow-hidden flex flex-col w-full transition-all",
          step === 2 ? "h-[90vh] max-h-[850px] max-w-5xl" : "h-auto max-w-[560px]"
        )}
      >
        
        {/* Header */}
        <div className="h-16 border-b border-white/5 flex items-center justify-center relative shrink-0 bg-[#071026]/50">
          {step === 2 && (
            <button 
              onClick={() => setStep(1)}
              className="absolute left-4 p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors flex items-center gap-1.5 text-sm font-medium pr-3"
              disabled={loading}
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}
          <h2 className="text-white font-bold text-lg">
            {step === 1 ? 'Create New Quiz' : 'Preview & Edit Content'}
          </h2>
          <button 
            onClick={onClose}
            className="absolute right-4 p-2 text-slate-400 hover:text-white hover:bg-[#EF4444]/20 hover:text-red-400 rounded-full transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {step === 1 ? (
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Quiz Title</label>
              <input 
                type="text" 
                placeholder="Enter quiz name..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#18233b] border border-white/5 focus:border-[#4F7CFF] text-white rounded-xl px-4 py-3 outline-none transition-all placeholder:text-slate-500"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Upload Word File (.docx)</label>
              <div className={cn(
                "relative border-2 border-dashed rounded-2xl p-8 transition-colors flex flex-col items-center justify-center gap-4 text-center cursor-pointer",
                file ? "border-[#4F7CFF] bg-[#4F7CFF]/5" : "border-slate-700 hover:border-slate-500 bg-[#071026]/50",
                loading && "opacity-50 pointer-events-none"
              )}>
                <input 
                  type="file" 
                  accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={loading}
                />
                
                {file ? (
                  <>
                    <div className="w-14 h-14 rounded-full bg-[#4F7CFF]/20 flex items-center justify-center text-[#4F7CFF]">
                      <FileText className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-[15px] line-clamp-1 px-4">{file.name}</p>
                      <p className="text-[#10B981] font-medium text-xs mt-1">{(file.size / 1024).toFixed(1)} KB • Ready to extract</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-full bg-[#18233b] flex items-center justify-center text-[#4F7CFF]">
                      <Upload className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-[15px]">Drop your file here or browse</p>
                      <p className="text-slate-500 text-xs mt-1 font-medium">Supported format: .docx</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center gap-4">
              <div className="h-px bg-white/5 flex-1"></div>
              <span className="text-[11px] text-slate-500 uppercase font-bold tracking-widest">OR</span>
              <div className="h-px bg-white/5 flex-1"></div>
            </div>

            <button 
              onClick={handleManualText}
              className="w-full py-3.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all flex items-center justify-center gap-2 font-semibold"
            >
              <Edit3 className="w-4 h-4" /> Create manually
            </button>

            <button 
              onClick={() => setShowGuide(true)}
              className="w-full py-2 text-[13px] text-[#4F7CFF] hover:text-[#6D91FF] transition-colors flex items-center justify-center gap-1.5 font-medium"
            >
              <HelpCircle className="w-4 h-4" /> View format guide
            </button>

            {error && (
              <div className="text-[#EF4444] text-sm bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl p-4 font-medium">
                {error}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-4 bg-[#4F7CFF]/10 border-b border-[#4F7CFF]/20 text-[13px] text-blue-100 shrink-0">
              <strong>Guide:</strong> Review your text format. Each question must be separated by <strong>1 blank line</strong>. Correct answer must have a <strong>*</strong> prefix (e.g. <i>*A. Answer</i>).
            </div>
            
            <div className="flex-1 flex min-h-0 relative bg-[#071026]">
              {/* Left Column: Textarea */}
              <div className="w-1/2 p-5 flex flex-col border-r border-white/5 relative">
                <textarea 
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Paste your quiz content here..."
                  className="flex-1 w-full bg-[#18233b] border border-white/5 focus:border-[#4F7CFF] text-slate-200 rounded-xl p-5 outline-none transition-all resize-none font-mono text-sm leading-relaxed"
                  disabled={loading}
                />
                {error && (
                  <div className="absolute bottom-8 left-8 right-8 text-[#EF4444] text-sm bg-[#0f172a]/90 border border-[#EF4444]/50 rounded-xl p-4 backdrop-blur-md shadow-2xl font-medium">
                    {error}
                  </div>
                )}
              </div>

              {/* Right Column: Live Preview */}
              <div className="w-1/2 flex flex-col bg-[#0f172a]">
                <div className="px-5 py-3 border-b border-white/5 bg-[#18233b]/30 flex items-center justify-between shrink-0">
                  <span className="font-semibold text-white text-sm">Live Preview</span>
                  <span className="px-3 py-1 bg-[#10B981]/10 text-[#10B981] text-xs font-bold rounded-full border border-[#10B981]/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                    Đã nhận diện: {parsedQuestions.length} câu
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {parsedQuestions.length === 0 ? (
                    <div className="text-center text-slate-500 py-10 flex flex-col items-center">
                      <HelpCircle className="w-10 h-10 mb-3 opacity-20" />
                      <p>Chưa nhận diện được câu hỏi nào.<br/>Hãy bắt đầu gõ hoặc dán nội dung ở cột bên trái.</p>
                    </div>
                  ) : parsedQuestions.map((q, idx) => {
                    const hasCorrect = q.options.some(o => o.isCorrect);
                    return (
                      <div key={idx} className={cn("p-4 bg-[#18233b] border rounded-xl transition-all", hasCorrect ? "border-white/5" : "border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]")}>
                        <p className="text-sm font-semibold text-white mb-3 break-words whitespace-pre-wrap">
                          <span className="text-[#4F7CFF] mr-2">Câu {idx + 1}:</span>
                          {q.questionText}
                        </p>
                        <div className="space-y-2">
                          {q.options.map((opt, oIdx) => (
                            <div 
                              key={oIdx} 
                              className={cn(
                                "text-[13px] px-3 py-2 rounded-lg border",
                                opt.isCorrect 
                                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-medium" 
                                  : "bg-[#071026] border-white/5 text-slate-400"
                              )}
                            >
                              {opt.text}
                            </div>
                          ))}
                        </div>
                        {!hasCorrect && (
                          <p className="text-xs text-amber-500 mt-3 flex items-center gap-1.5 font-medium">
                            <AlertCircle className="w-4 h-4" /> Câu này chưa có đáp án đúng (thiếu dấu *)
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-5 border-t border-white/5 flex gap-3 shrink-0 bg-[#0f172a]">
          <button 
            onClick={onClose}
            className="flex-1 py-3.5 rounded-xl font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            disabled={loading}
          >
            Cancel
          </button>
          
          {step === 1 ? (
            <button 
              onClick={handleExtractText}
              disabled={loading || !file || !title.trim()}
              className="flex-[2] bg-[#4F7CFF] hover:bg-[#6D91FF] disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(79,124,255,0.2)] hover:shadow-[0_6px_16px_rgba(79,124,255,0.3)] active:translate-y-0 disabled:shadow-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Extracting...</>
              ) : (
                'Continue'
              )}
            </button>
          ) : (
            <button 
              onClick={handleImportText}
              disabled={loading || !rawText.trim() || !title.trim()}
              className="flex-[2] bg-[#10B981] hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-[#020617] font-bold py-3.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(16,185,129,0.2)] hover:shadow-[0_6px_16px_rgba(16,185,129,0.3)] active:translate-y-0 disabled:shadow-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</>
              ) : (
                'Save Quiz'
              )}
            </button>
          )}
        </div>

      </div>

      <FormatGuideModal 
        isOpen={showGuide} 
        onClose={() => setShowGuide(false)} 
      />
    </div>
  );
}
