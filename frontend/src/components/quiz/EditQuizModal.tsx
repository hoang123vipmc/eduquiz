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
}

interface EditQuizModalProps {
  isOpen: boolean;
  quiz: QuizMeta | null;
  onClose: () => void;
  onSuccess: () => void;
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

  useEffect(() => { setDraft(question); }, [question]);

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraft({ ...question });
    setEditing(true);
    setExpanded(true);
    setError("");
  };

  const cancelEdit = () => { setDraft(question); setEditing(false); setError(""); };

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
    if (!draft.question_text.trim()) { setError("Noi dung cau hoi khong duoc de trong."); return; }
    if (!draft.options.some((o) => o.is_correct)) { setError("Phai co it nhat 1 dap an dung."); return; }
    if (draft.options.some((o) => !o.text.trim())) { setError("Tat ca lua chon phai co noi dung."); return; }
    setSaving(true); setError("");
    try {
      await onSave(draft);
      setEditing(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Luu that bai.");
    } finally { setSaving(false); }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Xoa cau hoi nay?")) return;
    setDeleting(true);
    try { await onDelete(question.id); } catch { alert("Xoa that bai."); } finally { setDeleting(false); }
  };

  return (
    <div className={cn("border rounded-xl transition-all duration-200", editing ? "border-primary/60 bg-primary/5 shadow-md" : "border-border/70 bg-card hover:border-border")}>
      <div className="flex items-start gap-3 p-3.5 cursor-pointer select-none" onClick={() => setExpanded(v => !v)}>
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-muted text-muted-foreground text-xs font-bold shrink-0 mt-0.5">{index + 1}</div>
        <p className="flex-1 text-sm leading-relaxed line-clamp-2 text-foreground/90">{question.question_text || <span className="italic text-muted-foreground">Cau hoi trong</span>}</p>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {!editing && (
            <>
              <button onClick={startEdit} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="Chinh sua"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={handleDelete} disabled={deleting} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50">{deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}</button>
            </>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>
      {expanded && (
        <div className="px-3.5 pb-4 space-y-3 border-t border-border/40 pt-3">
          {editing ? (
            <>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Noi dung cau hoi</label>
                <textarea value={draft.question_text} onChange={(e) => setDraft(d => ({ ...d, question_text: e.target.value }))} rows={3} className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" placeholder="Nhap noi dung cau hoi..." />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cac lua chon</label>
                  <button onClick={() => draft.options.length < 6 && setDraft(d => ({ ...d, options: [...d.options, { text: "", is_correct: false }] }))} className="text-xs text-primary font-medium flex items-center gap-1"><Plus className="w-3 h-3" />Them lua chon</button>
                </div>
                <div className="space-y-2">
                  {draft.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <button type="button" onClick={() => handleOptionChange(oi, "is_correct", !opt.is_correct)} className={cn("shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all", opt.is_correct ? "border-emerald-500 bg-emerald-500 text-white" : "border-border hover:border-emerald-400")}>{opt.is_correct && <Check className="w-3 h-3" />}</button>
                      <input value={opt.text} onChange={(e) => handleOptionChange(oi, "text", e.target.value)} className="flex-1 bg-background border border-border/80 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder={`Lua chon ${oi + 1}`} />
                      {draft.options.length > 2 && <button onClick={() => setDraft(d => ({ ...d, options: d.options.filter((_, i) => i !== oi) }))} className="p-1 text-muted-foreground hover:text-destructive rounded"><X className="w-3.5 h-3.5" /></button>}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Giai thich (tuy chon)</label>
                <textarea value={draft.explanation || ""} onChange={(e) => setDraft(d => ({ ...d, explanation: e.target.value }))} rows={2} className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" placeholder="Giai thich dap an dung..." />
              </div>
              {error && <div className="flex items-center gap-2 text-destructive text-xs bg-destructive/10 rounded-lg px-3 py-2"><AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}</div>}
              <div className="flex items-center gap-2 pt-1">
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-semibold transition-all disabled:opacity-70 shadow-sm">{saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}{saving ? "Dang luu..." : "Luu cau hoi"}</button>
                <button onClick={cancelEdit} disabled={saving} className="px-4 py-1.5 border border-border rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted">Huy</button>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              {question.options.map((opt, oi) => (
                <div key={oi} className={cn("flex items-start gap-2 px-3 py-2 rounded-lg text-sm", opt.is_correct ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 font-medium" : "bg-muted/50 text-muted-foreground border border-transparent")}>
                  {opt.is_correct ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" /> : <Circle className="w-4 h-4 shrink-0 mt-0.5" />}
                  <span>{opt.text}</span>
                </div>
              ))}
              {question.explanation && <div className="mt-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg text-xs text-amber-800 dark:text-amber-300"><span className="font-semibold">Giai thich: </span>{question.explanation}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function EditQuizModal({ isOpen, quiz, onClose, onSuccess }: EditQuizModalProps) {
  const [activeTab, setActiveTab] = useState<"info" | "questions">("questions");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [metaDraft, setMetaDraft] = useState<QuizMeta | null>(null);
  const [savingMeta, setSavingMeta] = useState(false);
  const [metaError, setMetaError] = useState("");
  const [metaSaved, setMetaSaved] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState<ReturnType<typeof blankQuestion>>(blankQuestion());
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [addError, setAddError] = useState("");
  const [qSearch, setQSearch] = useState("");

  const filteredQuestions = questions.filter(q => !qSearch || q.question_text.toLowerCase().includes(qSearch.toLowerCase()));

  useEffect(() => {
    if (!isOpen || !quiz) return;
    setMetaDraft({ ...quiz });
    setActiveTab("questions");
    setQSearch("");
    setShowAddQuestion(false);
    loadQuestions();
    loadCategories();
  }, [isOpen, quiz?.id]);

  const loadQuestions = async () => {
    if (!quiz) return;
    setLoadingQuestions(true);
    try {
      const { data } = await api.get(/quizzes//questions);
      if (data.success) {
        setQuestions((data.data as any[]).map(q => ({
          id: q.id,
          question_text: q.question_text,
          explanation: q.explanation || "",
          question_type: q.question_type || "single_choice",
          options: (q.options || []).map((o: any) => ({ id: o.id, text: o.text, is_correct: !!o.is_correct })),
          order: q.order ?? 0,
        })));
      }
    } catch (err) { console.error("Loi tai cau hoi:", err); } finally { setLoadingQuestions(false); }
  };

  const loadCategories = async () => {
    try {
      const { data } = await api.get("/categories");
      if (data.success || Array.isArray(data)) setCategories(Array.isArray(data) ? data : (data.data || []));
    } catch { }
  };

  const handleSaveMeta = async () => {
    if (!metaDraft || !quiz) return;
    if (!metaDraft.title.trim()) { setMetaError("Ten de thi khong duoc de trong."); return; }
    setSavingMeta(true); setMetaError("");
    try {
      const { data } = await api.put(/quizzes/, {
        title: metaDraft.title.trim(), description: metaDraft.description || "",
        category_id: metaDraft.category_id || null, duration_minutes: Number(metaDraft.duration_minutes) || 60,
        passing_score: Number(metaDraft.passing_score) || 80, visibility: metaDraft.visibility, status: metaDraft.status,
      });
      if (data.success) { setMetaSaved(true); setTimeout(() => setMetaSaved(false), 2500); onSuccess(); }
    } catch (err: any) { setMetaError(err?.response?.data?.message || "Cap nhat that bai."); } finally { setSavingMeta(false); }
  };

  const handleSaveQuestion = useCallback(async (updated: Question) => {
    const { data } = await api.put(/questions/, {
      question_text: updated.question_text.trim(), question_type: updated.question_type,
      explanation: updated.explanation || null,
      options: updated.options.map(o => ({ text: o.text.trim(), is_correct: o.is_correct })),
    });
    if (data.success) {
      setQuestions(prev => prev.map(q => q.id === updated.id ? { ...updated } : q));
      onSuccess();
    }
  }, [onSuccess]);

  const handleDeleteQuestion = useCallback(async (id: number) => {
    const { data } = await api.delete(/questions/);
    if (data.success) { setQuestions(prev => prev.filter(q => q.id !== id)); onSuccess(); }
  }, [onSuccess]);

  const handleAddQuestion = async () => {
    if (!quiz) return;
    if (!newQuestion.question_text.trim()) { setAddError("Noi dung cau hoi khong duoc de trong."); return; }
    if (!newQuestion.options.some(o => o.is_correct)) { setAddError("Phai co it nhat 1 dap an dung."); return; }
    if (newQuestion.options.some(o => !o.text.trim())) { setAddError("Tat ca lua chon phai co noi dung."); return; }
    setAddingQuestion(true); setAddError("");
    try {
      const { data } = await api.post(/quizzes//questions, {
        question_text: newQuestion.question_text.trim(), question_type: newQuestion.question_type,
        explanation: newQuestion.explanation || null,
        options: newQuestion.options.map(o => ({ text: o.text.trim(), is_correct: o.is_correct })),
      });
      if (data.success) {
        const created = data.data;
        setQuestions(prev => [...prev, { id: created.id, question_text: created.question_text, explanation: created.explanation || "", question_type: created.question_type, options: (created.options || []).map((o: any) => ({ id: o.id, text: o.text, is_correct: !!o.is_correct })) }]);
        setNewQuestion(blankQuestion()); setShowAddQuestion(false); onSuccess();
      }
    } catch (err: any) { setAddError(err?.response?.data?.message || "Them cau hoi that bai."); } finally { setAddingQuestion(false); }
  };

  if (!isOpen || !quiz) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl h-[92vh] bg-background rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-card/80 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0"><Pencil className="w-4 h-4" /></div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground truncate">{quiz.title}</h2>
            <p className="text-xs text-muted-foreground">{questions.length} cau hoi</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex border-b border-border bg-muted/30 shrink-0">
          {[{ key: "questions", label: "Cau hoi", icon: BookOpen }, { key: "info", label: "Thong tin de", icon: Settings }].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key as any)} className={cn("flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors border-b-2", activeTab === key ? "border-primary text-primary bg-background" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {activeTab === "questions" && (
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input value={qSearch} onChange={e => setQSearch(e.target.value)} placeholder="Tim cau hoi trong de..." className="w-full bg-card border border-border/80 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                  <Hash className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
                <button onClick={() => { setShowAddQuestion(true); setAddError(""); setNewQuestion(blankQuestion()); }} className="flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-semibold transition-all shadow-sm shrink-0"><Plus className="w-4 h-4" /><span className="hidden sm:inline">Them cau</span></button>
                <button onClick={loadQuestions} className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0" title="Tai lai"><RefreshCcw className="w-4 h-4" /></button>
              </div>
              {showAddQuestion && (
                <div className="border-2 border-dashed border-primary/40 bg-primary/5 rounded-2xl p-4 space-y-3">
                  <h3 className="text-sm font-bold text-primary flex items-center gap-2"><Plus className="w-4 h-4" />Them cau hoi moi</h3>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Noi dung cau hoi</label>
                    <textarea value={newQuestion.question_text} onChange={e => setNewQuestion(d => ({ ...d, question_text: e.target.value }))} rows={3} className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" placeholder="Nhap noi dung cau hoi..." autoFocus />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cac lua chon</label>
                      <button onClick={() => setNewQuestion(d => ({ ...d, options: [...d.options, { text: "", is_correct: false }] }))} disabled={newQuestion.options.length >= 6} className="text-xs text-primary font-medium flex items-center gap-1 disabled:opacity-40"><Plus className="w-3 h-3" />Them lua chon</button>
                    </div>
                    <div className="space-y-2">
                      {newQuestion.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <button type="button" onClick={() => { const opts = newQuestion.options.map((o, i) => ({ ...o, is_correct: newQuestion.question_type === "single_choice" ? i === oi : i === oi ? !o.is_correct : o.is_correct })); setNewQuestion(d => ({ ...d, options: opts })); }} className={cn("shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all", opt.is_correct ? "border-emerald-500 bg-emerald-500 text-white" : "border-border hover:border-emerald-400")}>{opt.is_correct && <Check className="w-3 h-3" />}</button>
                          <input value={opt.text} onChange={e => { const opts = newQuestion.options.map((o, i) => i === oi ? { ...o, text: e.target.value } : o); setNewQuestion(d => ({ ...d, options: opts })); }} className="flex-1 bg-background border border-border/80 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder={`Lua chon ${oi + 1}`} />
                          {newQuestion.options.length > 2 && <button onClick={() => setNewQuestion(d => ({ ...d, options: d.options.filter((_, i) => i !== oi) }))} className="p-1 text-muted-foreground hover:text-destructive rounded"><X className="w-3.5 h-3.5" /></button>}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Giai thich (tuy chon)</label>
                    <textarea value={newQuestion.explanation || ""} onChange={e => setNewQuestion(d => ({ ...d, explanation: e.target.value }))} rows={2} className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" placeholder="Giai thich dap an dung..." />
                  </div>
                  {addError && <div className="flex items-center gap-2 text-destructive text-xs bg-destructive/10 rounded-lg px-3 py-2"><AlertCircle className="w-3.5 h-3.5 shrink-0" />{addError}</div>}
                  <div className="flex items-center gap-2">
                    <button onClick={handleAddQuestion} disabled={addingQuestion} className="flex items-center gap-1.5 px-4 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-semibold disabled:opacity-70 shadow-sm">{addingQuestion ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}{addingQuestion ? "Dang them..." : "Them cau hoi"}</button>
                    <button onClick={() => { setShowAddQuestion(false); setAddError(""); }} className="px-4 py-1.5 border border-border rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted">Huy</button>
                  </div>
                </div>
              )}
              {loadingQuestions ? (
                <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground text-sm"><Loader2 className="w-5 h-5 animate-spin" />Dang tai cau hoi...</div>
              ) : filteredQuestions.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">{qSearch ? `Khong tim thay cau hoi nao chua "${qSearch}"` : "De thi chua co cau hoi nao"}</div>
              ) : (
                <div className="space-y-2">
                  {filteredQuestions.map((q, idx) => <QuestionRow key={q.id} question={q} index={idx} onSave={handleSaveQuestion} onDelete={handleDeleteQuestion} />)}
                </div>
              )}
            </div>
          )}
          {activeTab === "info" && metaDraft && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Ten de thi *</label>
                  <input value={metaDraft.title} onChange={e => setMetaDraft(d => d ? { ...d, title: e.target.value } : d)} className="w-full bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" placeholder="Ten de thi..." />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Mo ta</label>
                  <textarea value={metaDraft.description || ""} onChange={e => setMetaDraft(d => d ? { ...d, description: e.target.value } : d)} rows={3} className="w-full bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none transition-all" placeholder="Mo ta ngan ve de thi..." />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Mon hoc / Danh muc</label>
                  <select value={metaDraft.category_id ?? ""} onChange={e => setMetaDraft(d => d ? { ...d, category_id: e.target.value ? Number(e.target.value) : null } : d)} className="w-full bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer appearance-none">
                    <option value="">-- Chon danh muc --</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Thoi gian thi (phut)</label>
                  <div className="relative">
                    <Clock className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type="number" min={1} max={600} value={metaDraft.duration_minutes} onChange={e => setMetaDraft(d => d ? { ...d, duration_minutes: Number(e.target.value) } : d)} className="w-full bg-card border border-border/80 rounded-xl pl-9 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Diem dat (%)</label>
                  <input type="number" min={0} max={100} value={metaDraft.passing_score} onChange={e => setMetaDraft(d => d ? { ...d, passing_score: Number(e.target.value) } : d)} className="w-full bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Hien thi</label>
                  <select value={metaDraft.visibility} onChange={e => setMetaDraft(d => d ? { ...d, visibility: e.target.value as any } : d)} className="w-full bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer appearance-none">
                    <option value="public">Cong khai</option>
                    <option value="private">Rieng tu</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Trang thai</label>
                  <select value={metaDraft.status} onChange={e => setMetaDraft(d => d ? { ...d, status: e.target.value as any } : d)} className="w-full bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer appearance-none">
                    <option value="published">Da xuat ban</option>
                    <option value="draft">Ban nhap</option>
                  </select>
                </div>
              </div>
              {metaError && <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-xl px-4 py-3"><AlertCircle className="w-4 h-4 shrink-0" />{metaError}</div>}
            </div>
          )}
        </div>
        {activeTab === "info" && (
          <div className="flex items-center justify-end gap-3 px-5 py-3.5 border-t border-border bg-card/80 shrink-0">
            <button onClick={onClose} className="px-4 py-2 border border-border rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">Dong</button>
            <button onClick={handleSaveMeta} disabled={savingMeta} className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-semibold transition-all disabled:opacity-70 shadow-sm">{savingMeta ? <Loader2 className="w-4 h-4 animate-spin" /> : metaSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}{savingMeta ? "Dang luu..." : metaSaved ? "Da luu!" : "Luu thay doi"}</button>
          </div>
        )}
        {activeTab === "questions" && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-card/80 shrink-0 text-xs text-muted-foreground">
            <span>{filteredQuestions.length}/{questions.length} cau hoi{qSearch && ` - loc theo "${qSearch}"`}</span>
            <button onClick={onClose} className="px-4 py-1.5 border border-border rounded-lg text-xs font-medium hover:bg-muted transition-colors">Dong</button>
          </div>
        )}
      </div>
    </div>
  );
}
