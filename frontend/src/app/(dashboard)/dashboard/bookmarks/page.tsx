"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import { 
  Bookmark, 
  Trash2, 
  Search, 
  BookOpen, 
  Play, 
  Edit3, 
  Check, 
  X, 
  Sparkles, 
  HelpCircle,
  Printer,
  ChevronRight,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FormattedText, cleanOptionPrefix } from "@/components/quiz/FormattedText";

export default function BookmarksPage() {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const fetchBookmarks = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/bookmarks${search ? `?search=${encodeURIComponent(search)}` : ''}`);
      if (res.data?.success) {
        setBookmarks(res.data.data?.data || res.data.data || []);
      }
    } catch (err) {
      console.error("Lỗi tải bookmark", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBookmarks();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleToggleRemove = async (questionId: number) => {
    try {
      await api.post('/bookmarks/toggle', { question_id: questionId });
      setBookmarks(prev => prev.filter(b => b.question_id !== questionId));
    } catch (err) {
      console.error("Lỗi xóa bookmark", err);
    }
  };

  const handleStartEditNote = (bookmark: any) => {
    setEditingNoteId(bookmark.id);
    setNoteText(bookmark.note || "");
  };

  const handleSaveNote = async (bookmarkId: number) => {
    setSavingNote(true);
    try {
      await api.put(`/bookmarks/${bookmarkId}/note`, { note: noteText });
      setBookmarks(prev => prev.map(b => b.id === bookmarkId ? { ...b, note: noteText } : b));
      setEditingNoteId(null);
    } catch (err) {
      console.error("Lỗi lưu ghi chú", err);
    } finally {
      setSavingNote(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-card border border-border/80 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/25">
            <Bookmark className="w-6 h-6 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Sổ tay câu hỏi khó</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30">
                {bookmarks.length} câu
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Lưu giữ những câu hỏi hay nhầm lẫn để ôn luyện trọng tâm trước ngày thi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {bookmarks.length > 0 && (
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In / Xuất PDF</span>
            </button>
          )}
          <button
            onClick={() => router.push('/dashboard/quizzes')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-xs transition-all active:scale-95"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Kho đề thi</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-3.5 py-2.5 shadow-xs">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input 
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm nội dung câu hỏi trong sổ tay..."
          className="flex-1 bg-transparent border-none text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        {search && (
          <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-card border border-border animate-pulse space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-muted rounded w-28" />
                <div className="h-8 w-8 bg-muted rounded-lg" />
              </div>
              <div className="h-5 bg-muted rounded w-4/5" />
              <div className="space-y-2 pt-2">
                <div className="h-9 bg-muted rounded-xl w-full" />
                <div className="h-9 bg-muted rounded-xl w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-card rounded-2xl border border-dashed border-border shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4 border border-amber-500/20">
            <Bookmark className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">
            {search ? "Không tìm thấy câu hỏi phù hợp" : "Sổ tay câu khó đang trống"}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mb-5">
            {search 
              ? "Hãy thử tìm kiếm với từ khóa khác." 
              : "Trong lúc làm bài thi trắc nghiệm hoặc xem lại kết quả, hãy bấm biểu tượng Bookmark 🔖 để lưu câu hỏi khó vào đây ôn tập!"}
          </p>
          <button
            onClick={() => router.push('/dashboard/quizzes')}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            Bắt đầu làm bài thi
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookmarks.map((bm, index) => {
            const q = bm.question;
            const options = q?.options || [];
            const isEditing = editingNoteId === bm.id;

            return (
              <div 
                key={bm.id} 
                className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs hover:border-border/80 transition-all space-y-3.5"
              >
                {/* Header row */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      Câu #{index + 1}
                    </span>
                    {bm.quiz?.title && (
                      <span className="text-xs font-medium text-muted-foreground truncate max-w-xs sm:max-w-md">
                        Đề: <strong className="text-foreground">{bm.quiz.title}</strong>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleStartEditNote(bm)}
                      title="Ghi chú mẹo nhớ"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-xs flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Ghi chú</span>
                    </button>
                    <button
                      onClick={() => handleToggleRemove(bm.question_id)}
                      title="Bỏ lưu khỏi sổ tay"
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <div className="text-sm sm:text-base font-semibold text-foreground leading-relaxed">
                  <FormattedText text={q?.question_text || ""} />
                </div>

                {/* Question Image */}
                {q?.question_image && (
                  <div className="rounded-xl overflow-hidden border border-border/80 bg-muted/20 p-2.5 max-w-lg mx-auto flex justify-center">
                    <img
                      src={q.question_image}
                      alt="Ảnh câu hỏi"
                      className="max-h-64 max-w-full rounded-lg object-contain shadow-xs"
                    />
                  </div>
                )}

                {/* Options List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {options.map((opt: any, optIdx: number) => {
                    const prefix = String.fromCharCode(65 + optIdx);
                    const isCorrect = Boolean(opt.is_correct);

                    return (
                      <div 
                        key={opt.id || optIdx}
                        className={cn(
                          "flex items-start gap-2.5 p-2.5 rounded-xl border text-xs sm:text-sm transition-all",
                          isCorrect 
                            ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-semibold"
                            : "bg-muted/40 border-border/60 text-muted-foreground"
                        )}
                      >
                        <span className={cn(
                          "w-5 h-5 rounded-md flex items-center justify-center shrink-0 font-bold text-[11px]",
                          isCorrect ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                        )}>
                          {prefix}
                        </span>
                        <span className="flex-1 min-w-0">
                          <FormattedText text={cleanOptionPrefix(opt.option_text || "")} />
                        </span>
                        {isCorrect && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                            Đáp án đúng
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation if any */}
                {q?.explanation && (
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-foreground flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <strong className="text-blue-500 block mb-0.5">Lời giải chi tiết:</strong>
                      <FormattedText text={q.explanation} />
                    </div>
                  </div>
                )}

                {/* Note Section */}
                {isEditing ? (
                  <div className="p-3 rounded-xl bg-muted/60 border border-border space-y-2">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-amber-500" />
                      Ghi chú / Mẹo nhớ của bạn:
                    </label>
                    <textarea 
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Nhập mẹo ghi nhớ, lý do hay nhầm lẫn..."
                      className="w-full bg-card border border-border rounded-lg p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-amber-500 min-h-[64px]"
                    />
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => setEditingNoteId(null)}
                        className="px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground rounded-lg"
                      >
                        Hủy
                      </button>
                      <button 
                        onClick={() => handleSaveNote(bm.id)}
                        disabled={savingNote}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Lưu ghi chú
                      </button>
                    </div>
                  </div>
                ) : bm.note ? (
                  <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-foreground flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold shrink-0">💡 Ghi chú:</span>
                      <span className="text-muted-foreground">{bm.note}</span>
                    </div>
                    <button 
                      onClick={() => handleStartEditNote(bm)}
                      className="text-muted-foreground hover:text-foreground text-[11px] shrink-0"
                    >
                      Sửa
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
