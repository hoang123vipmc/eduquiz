"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Save,
  Pencil,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  AlertCircle,
  Loader2,
  Check,
  RefreshCcw,
  Settings,
  BookOpen,
  Hash,
  Clock,
  Folder,
  FolderPlus,
  Tag,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";

interface Option {
  id?: number;
  text: string;
  is_correct: boolean;
}

interface Question {
  id: number;
  question_text: string;
  explanation?: string;
  question_type: "single_choice" | "multiple_choice" | "true_false";
  options: Option[];
  order?: number;
}

interface QuizMeta {
  id: number;
  title: string;
  description?: string;
  category_id?: number | null;
  category?: { id: number; name: string } | null;
  cover_image?: string;
  duration_minutes: number;
  passing_score: number;
  visibility: "public" | "private";
  status: "draft" | "published";
  total_questions?: number;
}

interface Category {
  id: number;
  name: string;
  slug?: string;
  icon?: string;
  quizzes_count?: number;
}

interface EditQuizModalProps {
  isOpen: boolean;
  quiz: QuizMeta | null;
  onClose: () => void;
  onSuccess?: () => void;
  onUpdated?: () => void;
}

function blankQuestion(): Omit<Question, "id"> {
  return {
    question_text: "",
    explanation: "",
    question_type: "single_choice",
    options: [
      { text: "", is_correct: true },
      { text: "", is_correct: false },
      { text: "", is_correct: false },
      { text: "", is_correct: false },
    ],
  };
}

interface QuestionRowProps {
  question: Question;
  index: number;
  onSave: (q: Question) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

function QuestionRow({ question, index, onSave, onDelete }: QuestionRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [draft, setDraft] = useState<Question>(question);
  const [error, setError] = useState("");

  useEffect(() => {
    setDraft(question);
  }, [question]);

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraft({ ...question });
    setEditing(true);
    setExpanded(true);
    setError("");
  };

  const cancelEdit = () => {
    setDraft(question);
    setEditing(false);
    setError("");
  };

  const handleOptionChange = (idx: number, field: "text" | "is_correct", value: string | boolean) => {
    const opts = draft.options.map((o, i) => {
      if (draft.question_type === "single_choice" && field === "is_correct" && value === true) {
        return { ...o, is_correct: i === idx };
      }
      if (i === idx) return { ...o, [field]: value };
      return o;
    });
    setDraft((d) => ({ ...d, options: opts }));
  };

  const handleSave = async () => {
    if (!draft.question_text.trim()) {
      setError("Nội dung câu hỏi không được để trống.");
      return;
    }
    if (!draft.options.some((o) => o.is_correct)) {
      setError("Phải có ít nhất 1 đáp án đúng.");
      return;
    }
    if (draft.options.some((o) => !o.text.trim())) {
      setError("Tất cả các lựa chọn phải có nội dung.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(draft);
      setEditing(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Lưu câu hỏi thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Bạn có chắc chắn muốn xóa câu hỏi này?")) return;
    setDeleting(true);
    try {
      await onDelete(question.id);
    } catch {
      alert("Xóa thất bại.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className={cn(
        "border rounded-xl transition-all duration-200",
        editing
          ? "border-primary/60 bg-primary/5 shadow-md"
          : "border-border/70 bg-card hover:border-border"
      )}
    >
      <div
        className="flex items-start gap-3 p-3.5 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-muted text-muted-foreground text-xs font-bold shrink-0 mt-0.5">
          {index + 1}
        </div>
        <p className="flex-1 text-sm leading-relaxed line-clamp-2 text-foreground/90 font-medium">
          {question.question_text || <span className="italic text-muted-foreground">Câu hỏi trống</span>}
        </p>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {!editing && (
            <>
              <button
                onClick={startEdit}
                className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                title="Chỉnh sửa câu hỏi"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                title="Xóa câu hỏi"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              </button>
            </>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-3.5 pb-4 space-y-3 border-t border-border/40 pt-3">
          {editing ? (
            <>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">
                  Nội dung câu hỏi
                </label>
                <textarea
                  value={draft.question_text}
                  onChange={(e) => setDraft((d) => ({ ...d, question_text: e.target.value }))}
                  rows={3}
                  className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                  placeholder="Nhập nội dung câu hỏi..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Các lựa chọn
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      draft.options.length < 6 &&
                      setDraft((d) => ({
                        ...d,
                        options: [...d.options, { text: "", is_correct: false }],
                      }))
                    }
                    className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3 h-3" />
                    Thêm lựa chọn
                  </button>
                </div>
                <div className="space-y-2">
                  {draft.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOptionChange(oi, "is_correct", !opt.is_correct)}
                        title={opt.is_correct ? "Đáp án đúng" : "Đánh dấu đáp án đúng"}
                        className={cn(
                          "shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                          opt.is_correct
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-border hover:border-emerald-400"
                        )}
                      >
                        {opt.is_correct && <Check className="w-3 h-3" />}
                      </button>
                      <input
                        value={opt.text}
                        onChange={(e) => handleOptionChange(oi, "text", e.target.value)}
                        className="flex-1 bg-background border border-border/80 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder={`Lựa chọn ${oi + 1}`}
                      />
                      {draft.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() =>
                            setDraft((d) => ({
                              ...d,
                              options: d.options.filter((_, i) => i !== oi),
                            }))
                          }
                          className="p-1 text-muted-foreground hover:text-destructive rounded"
                          title="Xóa lựa chọn này"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">
                  Giải thích (tùy chọn)
                </label>
                <textarea
                  value={draft.explanation || ""}
                  onChange={(e) => setDraft((d) => ({ ...d, explanation: e.target.value }))}
                  rows={2}
                  className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  placeholder="Giải thích tại sao đáp án này đúng..."
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-destructive text-xs bg-destructive/10 rounded-lg px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-semibold transition-all disabled:opacity-70 shadow-sm"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {saving ? "Đang lưu..." : "Lưu câu hỏi"}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={saving}
                  className="px-4 py-1.5 border border-border rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  Hủy
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              {question.options.map((opt, oi) => (
                <div
                  key={oi}
                  className={cn(
                    "flex items-start gap-2 px-3 py-2 rounded-lg text-sm",
                    opt.is_correct
                      ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 font-medium"
                      : "bg-muted/50 text-muted-foreground border border-transparent"
                  )}
                >
                  {opt.is_correct ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                  ) : (
                    <Circle className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground/60" />
                  )}
                  <span>{opt.text}</span>
                </div>
              ))}
              {question.explanation && (
                <div className="mt-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg text-xs text-amber-800 dark:text-amber-300">
                  <span className="font-semibold">Giải thích: </span>
                  {question.explanation}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function EditQuizModal({ isOpen, quiz, onClose, onSuccess, onUpdated }: EditQuizModalProps) {
  const [activeTab, setActiveTab] = useState<"info" | "questions">("questions");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [metaDraft, setMetaDraft] = useState<QuizMeta | null>(null);
  const [savingMeta, setSavingMeta] = useState(false);
  const [metaError, setMetaError] = useState("");
  const [metaSaved, setMetaSaved] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState<ReturnType<typeof blankQuestion>>(blankQuestion());
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [addError, setAddError] = useState("");
  const [qSearch, setQSearch] = useState("");

  const handleQuickUpdateCategory = async (catId: number | null) => {
    setMetaDraft((d) => (d ? { ...d, category_id: catId } : d));
    if (!quiz?.id) return;
    try {
      const { data } = await api.put(`/quizzes/${quiz.id}`, {
        category_id: catId,
      });
      if (data.success) {
        setMetaSaved(true);
        setTimeout(() => setMetaSaved(false), 2500);
        triggerNotifyUpdated();
      }
    } catch (err: any) {
      console.error("Lỗi cập nhật danh mục:", err);
    }
  };

  const handleCreateCategory = async (nameToUse?: string) => {
    const name = (nameToUse || newCategoryName).trim();
    if (!name) return;
    setCreatingCategory(true);
    try {
      const { data } = await api.post("/categories", { name });
      if (data.success && data.data) {
        const created = data.data;
        setCategories((prev) => {
          if (prev.some((c) => c.id === created.id)) return prev;
          return [...prev, created].sort((a, b) => a.name.localeCompare(b.name));
        });
        setMetaDraft((d) => (d ? { ...d, category_id: created.id } : d));
        setNewCategoryName("");
        setShowCreateCategory(false);
        // Lưu ngay lập tức danh mục vào đề thi
        await handleQuickUpdateCategory(created.id);
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || "Không thể tạo danh mục mới.");
    } finally {
      setCreatingCategory(false);
    }
  };

  const triggerNotifyUpdated = useCallback(() => {
    onSuccess?.();
    onUpdated?.();
  }, [onSuccess, onUpdated]);

  const loadQuestions = useCallback(async () => {
    if (!quiz?.id) return;
    setLoadingQuestions(true);
    try {
      const { data } = await api.get(`/quizzes/${quiz.id}/questions?_t=${Date.now()}`);
      if (data.success) {
        const rawList = Array.isArray(data.data) ? data.data : (data.data?.data || []);
        setQuestions(
          rawList.map((q: any) => ({
            id: q.id,
            question_text: q.question_text || "",
            explanation: q.explanation || "",
            question_type: q.type || q.question_type || "single_choice",
            options: (q.options || []).map((o: any) => ({
              id: o.id,
              text: o.option_text || o.text || "",
              is_correct: Boolean(o.is_correct),
            })),
            order: q.order ?? 0,
          }))
        );
      }
    } catch (err) {
      console.error("Lỗi tải câu hỏi:", err);
    } finally {
      setLoadingQuestions(false);
    }
  }, [quiz?.id]);

  const loadCategories = useCallback(async () => {
    try {
      const { data } = await api.get("/categories");
      if (data.success || Array.isArray(data)) {
        setCategories(Array.isArray(data) ? data : (data.data || []));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !quiz) return;
    setMetaDraft({
      ...quiz,
      category_id: quiz.category_id ?? quiz.category?.id ?? null,
    });
    setActiveTab("questions");
    setQSearch("");
    setShowAddQuestion(false);
    loadQuestions();
    loadCategories();
  }, [isOpen, quiz?.id, loadQuestions, loadCategories]);

  const filteredQuestions = questions.filter(
    (q) => !qSearch || q.question_text.toLowerCase().includes(qSearch.toLowerCase())
  );

  const handleSaveMeta = async () => {
    if (!metaDraft || !quiz?.id) return;
    if (!metaDraft.title.trim()) {
      setMetaError("Tên đề thi không được để trống.");
      return;
    }
    setSavingMeta(true);
    setMetaError("");
    try {
      const { data } = await api.put(`/quizzes/${quiz.id}`, {
        title: metaDraft.title.trim(),
        description: metaDraft.description || "",
        category_id: metaDraft.category_id || null,
        duration_minutes: Number(metaDraft.duration_minutes) || 60,
        passing_score: Number(metaDraft.passing_score) || 80,
        visibility: metaDraft.visibility,
        status: metaDraft.status,
      });
      if (data.success) {
        setMetaSaved(true);
        setTimeout(() => setMetaSaved(false), 2500);
        triggerNotifyUpdated();
      }
    } catch (err: any) {
      setMetaError(err?.response?.data?.message || "Cập nhật đề thi thất bại.");
    } finally {
      setSavingMeta(false);
    }
  };

  const handleSaveQuestion = useCallback(
    async (updated: Question) => {
      const { data } = await api.put(`/questions/${updated.id}`, {
        question_text: updated.question_text.trim(),
        type: updated.question_type,
        question_type: updated.question_type,
        explanation: updated.explanation || null,
        options: updated.options.map((o, idx) => ({
          text: o.text.trim(),
          option_text: o.text.trim(),
          is_correct: Boolean(o.is_correct),
          order: idx,
        })),
      });
      if (data.success) {
        setQuestions((prev) => prev.map((q) => (q.id === updated.id ? { ...updated } : q)));
        triggerNotifyUpdated();
      }
    },
    [triggerNotifyUpdated]
  );

  const handleDeleteQuestion = useCallback(
    async (id: number) => {
      const { data } = await api.delete(`/questions/${id}`);
      if (data.success) {
        setQuestions((prev) => prev.filter((q) => q.id !== id));
        triggerNotifyUpdated();
      }
    },
    [triggerNotifyUpdated]
  );

  const handleAddQuestion = async () => {
    if (!quiz?.id) return;
    if (!newQuestion.question_text.trim()) {
      setAddError("Nội dung câu hỏi không được để trống.");
      return;
    }
    if (!newQuestion.options.some((o) => o.is_correct)) {
      setAddError("Phải có ít nhất 1 đáp án đúng.");
      return;
    }
    if (newQuestion.options.some((o) => !o.text.trim())) {
      setAddError("Tất cả các lựa chọn phải có nội dung.");
      return;
    }
    setAddingQuestion(true);
    setAddError("");
    try {
      const { data } = await api.post(`/quizzes/${quiz.id}/questions`, {
        question_text: newQuestion.question_text.trim(),
        type: newQuestion.question_type,
        question_type: newQuestion.question_type,
        difficulty: "medium",
        points: 1,
        explanation: newQuestion.explanation || null,
        options: newQuestion.options.map((o, idx) => ({
          text: o.text.trim(),
          option_text: o.text.trim(),
          is_correct: Boolean(o.is_correct),
          order: idx,
        })),
      });
      if (data.success) {
        const created = data.data;
        setQuestions((prev) => [
          ...prev,
          {
            id: created.id,
            question_text: created.question_text,
            explanation: created.explanation || "",
            question_type: created.type || created.question_type || "single_choice",
            options: (created.options || []).map((o: any) => ({
              id: o.id,
              text: o.option_text || o.text || "",
              is_correct: Boolean(o.is_correct),
            })),
          },
        ]);
        setNewQuestion(blankQuestion());
        setShowAddQuestion(false);
        triggerNotifyUpdated();
      }
    } catch (err: any) {
      setAddError(err?.response?.data?.message || "Thêm câu hỏi thất bại.");
    } finally {
      setAddingQuestion(false);
    }
  };

  if (!isOpen || !quiz) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl h-[92vh] bg-background rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-card/80 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Pencil className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground truncate">{quiz.title}</h2>
            <p className="text-xs text-muted-foreground">{questions.length} câu hỏi trong đề</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Category Bar - Always accessible across all tabs */}
        <div className="bg-primary/5 border-b border-primary/15 px-4 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2.5 text-xs shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <Folder className="w-4 h-4 text-primary shrink-0" />
            <span className="font-semibold text-foreground shrink-0">Danh mục:</span>
            <select
              value={metaDraft?.category_id ?? ""}
              onChange={(e) => {
                const newId = e.target.value ? Number(e.target.value) : null;
                handleQuickUpdateCategory(newId);
              }}
              className="bg-card border border-border text-foreground rounded-lg px-2.5 py-1 text-xs font-semibold focus:ring-1 focus:ring-primary cursor-pointer flex-1 max-w-[280px] truncate shadow-xs"
            >
              <option value="">-- Chưa phân loại --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  📂 {cat.name}
                </option>
              ))}
            </select>
            {metaSaved && (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" /> Đã lưu danh mục!
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveTab("info");
              setShowCreateCategory(true);
            }}
            className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Tạo danh mục mới
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-border bg-muted/30 shrink-0">
          {[
            { key: "questions", label: "Câu hỏi", icon: BookOpen },
            { key: "info", label: "Thông tin đề", icon: Settings },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors border-b-2",
                activeTab === key
                  ? "border-primary text-primary bg-background"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "questions" && (
            <div className="p-4 space-y-3">
              {/* Question search & Add Button */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    value={qSearch}
                    onChange={(e) => setQSearch(e.target.value)}
                    placeholder="Tìm câu hỏi trong đề..."
                    className="w-full bg-card border border-border/80 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  <Hash className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddQuestion(true);
                    setAddError("");
                    setNewQuestion(blankQuestion());
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-semibold transition-all shadow-sm shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Thêm câu</span>
                </button>
                <button
                  type="button"
                  onClick={loadQuestions}
                  className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                  title="Tải lại danh sách câu hỏi"
                >
                  <RefreshCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Add New Question Form */}
              {showAddQuestion && (
                <div className="border-2 border-dashed border-primary/40 bg-primary/5 rounded-2xl p-4 space-y-3">
                  <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Thêm câu hỏi mới
                  </h3>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">
                      Nội dung câu hỏi
                    </label>
                    <textarea
                      value={newQuestion.question_text}
                      onChange={(e) =>
                        setNewQuestion((d) => ({ ...d, question_text: e.target.value }))
                      }
                      rows={3}
                      className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                      placeholder="Nhập nội dung câu hỏi..."
                      autoFocus
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Các lựa chọn
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setNewQuestion((d) => ({
                            ...d,
                            options: [...d.options, { text: "", is_correct: false }],
                          }))
                        }
                        disabled={newQuestion.options.length >= 6}
                        className="text-xs text-primary font-medium flex items-center gap-1 disabled:opacity-40"
                      >
                        <Plus className="w-3 h-3" />
                        Thêm lựa chọn
                      </button>
                    </div>

                    <div className="space-y-2">
                      {newQuestion.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const opts = newQuestion.options.map((o, i) => ({
                                ...o,
                                is_correct:
                                  newQuestion.question_type === "single_choice"
                                    ? i === oi
                                    : i === oi
                                    ? !o.is_correct
                                    : o.is_correct,
                              }));
                              setNewQuestion((d) => ({ ...d, options: opts }));
                            }}
                            title={opt.is_correct ? "Đáp án đúng" : "Đánh dấu đáp án đúng"}
                            className={cn(
                              "shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                              opt.is_correct
                                ? "border-emerald-500 bg-emerald-500 text-white"
                                : "border-border hover:border-emerald-400"
                            )}
                          >
                            {opt.is_correct && <Check className="w-3 h-3" />}
                          </button>
                          <input
                            value={opt.text}
                            onChange={(e) => {
                              const opts = newQuestion.options.map((o, i) =>
                                i === oi ? { ...o, text: e.target.value } : o
                              );
                              setNewQuestion((d) => ({ ...d, options: opts }));
                            }}
                            className="flex-1 bg-background border border-border/80 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder={`Lựa chọn ${oi + 1}`}
                          />
                          {newQuestion.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() =>
                                setNewQuestion((d) => ({
                                  ...d,
                                  options: d.options.filter((_, i) => i !== oi),
                                }))
                              }
                              className="p-1 text-muted-foreground hover:text-destructive rounded"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">
                      Giải thích (tùy chọn)
                    </label>
                    <textarea
                      value={newQuestion.explanation || ""}
                      onChange={(e) =>
                        setNewQuestion((d) => ({ ...d, explanation: e.target.value }))
                      }
                      rows={2}
                      className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                      placeholder="Giải thích đáp án đúng..."
                    />
                  </div>

                  {addError && (
                    <div className="flex items-center gap-2 text-destructive text-xs bg-destructive/10 rounded-lg px-3 py-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {addError}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      disabled={addingQuestion}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-semibold disabled:opacity-70 shadow-sm"
                    >
                      {addingQuestion ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                      {addingQuestion ? "Đang thêm..." : "Thêm câu hỏi"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddQuestion(false);
                        setAddError("");
                      }}
                      className="px-4 py-1.5 border border-border rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}

              {/* Questions List */}
              {loadingQuestions ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground text-sm">
                  <Loader2 className="w-7 h-7 animate-spin text-primary" />
                  <span>Đang tải danh sách câu hỏi...</span>
                </div>
              ) : filteredQuestions.length === 0 ? (
                <div className="text-center py-16 px-4 bg-card/40 rounded-2xl border border-dashed border-border/80">
                  <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3 text-muted-foreground">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1">
                    {qSearch
                      ? `Không tìm thấy câu hỏi nào chứa "${qSearch}"`
                      : "Đề thi chưa có câu hỏi nào"}
                  </p>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto mb-4">
                    {qSearch
                      ? "Hãy thử tìm với từ khóa khác hoặc xóa bộ lọc."
                      : "Hãy nhấn nút \"Thêm câu\" bên trên để thêm câu hỏi đầu tiên."}
                  </p>
                  {qSearch && (
                    <button
                      onClick={() => setQSearch("")}
                      className="text-xs text-primary font-medium hover:underline"
                    >
                      Xóa tìm kiếm
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredQuestions.map((q, idx) => (
                    <QuestionRow
                      key={q.id}
                      question={q}
                      index={idx}
                      onSave={handleSaveQuestion}
                      onDelete={handleDeleteQuestion}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "info" && metaDraft && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">
                    Tên đề thi *
                  </label>
                  <input
                    value={metaDraft.title}
                    onChange={(e) =>
                      setMetaDraft((d) => (d ? { ...d, title: e.target.value } : d))
                    }
                    className="w-full bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    placeholder="Tên đề thi..."
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">
                    Mô tả
                  </label>
                  <textarea
                    value={metaDraft.description || ""}
                    onChange={(e) =>
                      setMetaDraft((d) => (d ? { ...d, description: e.target.value } : d))
                    }
                    rows={3}
                    className="w-full bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none transition-all"
                    placeholder="Mô tả ngắn gọn về nội dung đề thi..."
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <Folder className="w-3.5 h-3.5 text-primary" />
                      <span>Môn học / Danh mục</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCreateCategory(!showCreateCategory)}
                      className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{showCreateCategory ? "Đóng tạo nhanh" : "+ Thêm danh mục mới"}</span>
                    </button>
                  </div>

                  {/* Dropdown chọn danh mục */}
                  <select
                    value={metaDraft.category_id ?? ""}
                    onChange={(e) => {
                      const newId = e.target.value ? Number(e.target.value) : null;
                      handleQuickUpdateCategory(newId);
                    }}
                    className="w-full bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer font-medium"
                  >
                    <option value="">-- Chưa phân loại / Không chọn --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        📂 {cat.name} {cat.quizzes_count !== undefined ? `(${cat.quizzes_count} đề)` : ""}
                      </option>
                    ))}
                  </select>

                  {/* Form inline tạo danh mục mới */}
                  {showCreateCategory && (
                    <div className="mt-2.5 p-3 rounded-xl bg-primary/5 border border-primary/20 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                        <FolderPlus className="w-4 h-4 text-primary" />
                        <span>Tạo danh mục môn học mới:</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleCreateCategory();
                            }
                          }}
                          placeholder="Ví dụ: Triết học Mác-Lênin, Cơ sở dữ liệu..."
                          className="flex-1 bg-card border border-border/80 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <button
                          type="button"
                          onClick={() => handleCreateCategory()}
                          disabled={creatingCategory || !newCategoryName.trim()}
                          className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-colors shrink-0"
                        >
                          {creatingCategory ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Plus className="w-3 h-3" />
                          )}
                          <span>Tạo & Chọn</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Gợi ý danh mục đại học phổ biến */}
                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" /> Gợi ý:
                    </span>
                    {[
                      "Triết học & Khoa học chính trị",
                      "Công nghệ thông tin",
                      "Kinh tế & Quản trị kinh doanh",
                      "Ngoại ngữ & Tiếng Anh",
                      "Pháp luật đại cương",
                      "Toán & Khoa học tự nhiên",
                    ].map((sug) => {
                      const matchedCat = categories.find(
                        (c) => c.name.toLowerCase() === sug.toLowerCase()
                      );
                      const isSelected = matchedCat && metaDraft.category_id === matchedCat.id;
                      return (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => {
                            if (matchedCat) {
                              handleQuickUpdateCategory(matchedCat.id);
                            } else {
                              handleCreateCategory(sug);
                            }
                          }}
                          className={cn(
                            "text-[11px] px-2 py-0.5 rounded-md border transition-all",
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary font-semibold"
                              : "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border-border/60"
                          )}
                        >
                          {sug}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">
                    Thời gian thi (phút)
                  </label>
                  <div className="relative">
                    <Clock className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="number"
                      min={1}
                      max={600}
                      value={metaDraft.duration_minutes}
                      onChange={(e) =>
                        setMetaDraft((d) =>
                          d ? { ...d, duration_minutes: Number(e.target.value) } : d
                        )
                      }
                      className="w-full bg-card border border-border/80 rounded-xl pl-9 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">
                    Điểm đạt (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={metaDraft.passing_score}
                    onChange={(e) =>
                      setMetaDraft((d) =>
                        d ? { ...d, passing_score: Number(e.target.value) } : d
                      )
                    }
                    className="w-full bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">
                    Hiển thị
                  </label>
                  <select
                    value={metaDraft.visibility}
                    onChange={(e) =>
                      setMetaDraft((d) => (d ? { ...d, visibility: e.target.value as any } : d))
                    }
                    className="w-full bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    <option value="public">Công khai (Mọi người đều thấy)</option>
                    <option value="private">Riêng tư (Chỉ mình bạn)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">
                    Trạng thái
                  </label>
                  <select
                    value={metaDraft.status}
                    onChange={(e) =>
                      setMetaDraft((d) => (d ? { ...d, status: e.target.value as any } : d))
                    }
                    className="w-full bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    <option value="published">Đã xuất bản</option>
                    <option value="draft">Bản nháp</option>
                  </select>
                </div>
              </div>

              {metaError && (
                <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {metaError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {activeTab === "info" && (
          <div className="flex items-center justify-end gap-3 px-5 py-3.5 border-t border-border bg-card/80 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Đóng
            </button>
            <button
              onClick={handleSaveMeta}
              disabled={savingMeta}
              className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-semibold transition-all disabled:opacity-70 shadow-sm"
            >
              {savingMeta ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : metaSaved ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {savingMeta ? "Đang lưu..." : metaSaved ? "Đã lưu!" : "Lưu thay đổi"}
            </button>
          </div>
        )}

        {activeTab === "questions" && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-card/80 shrink-0 text-xs text-muted-foreground">
            <span>
              {filteredQuestions.length}/{questions.length} câu hỏi
              {qSearch && ` - lọc theo "${qSearch}"`}
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 border border-border rounded-lg text-xs font-medium hover:bg-muted transition-colors"
            >
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
