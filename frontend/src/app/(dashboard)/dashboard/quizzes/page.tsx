"use client";

import React, { useEffect, useState, useMemo } from "react";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import { 
  Clock, 
  HelpCircle, 
  CheckCircle2, 
  FileUp, 
  Trash2, 
  Users, 
  Search,
  Play,
  Library,
  BookOpen,
  GraduationCap,
  Code2,
  Cpu,
  BrainCircuit,
  Sparkles,
  ArrowUpDown,
  Filter,
  FileQuestion,
  Target,
  Printer,
  Pencil
} from "lucide-react";

import { QuizSettingsModal } from "@/components/quiz/QuizSettingsModal";
import { ImportQuizModal } from "@/components/quiz/ImportQuizModal";
import { PrintQuizModal } from "@/components/quiz/PrintQuizModal";
import { EditQuizModal } from "@/components/quiz/EditQuizModal";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import { 
  rankQuizzesBySchedule, 
  RecommendedQuiz, 
  isQuizMatchingSubject, 
  ScheduleItem 
} from "@/lib/quizRecommendations";

// Helper to determine subject theme and icons based on title/category
function getQuizTheme(title: string, categoryName?: string) {
  const text = (title + " " + (categoryName || "")).toLowerCase();
  
  if (text.includes("java") || text.includes("code") || text.includes("mã nguồn") || text.includes("web") || text.includes("lập trình") || text.includes("python")) {
    return {
      icon: Code2,
      accentBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      gradient: "from-blue-600 to-indigo-600",
      badgeColor: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      defaultTag: "Lập trình"
    };
  }
  if (text.includes("mạng") || text.includes("qtm") || text.includes("đtdm") || text.includes("cloud") || text.includes("hệ thống")) {
    return {
      icon: Cpu,
      accentBg: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
      gradient: "from-cyan-500 to-blue-600",
      badgeColor: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
      defaultTag: "Hệ thống"
    };
  }
  if (text.includes("hỗ trợ") || text.includes("ai") || text.includes("thông minh") || text.includes("dữ liệu") || text.includes("data")) {
    return {
      icon: BrainCircuit,
      accentBg: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
      gradient: "from-purple-600 to-indigo-600",
      badgeColor: "bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border-violet-200 dark:border-violet-800",
      defaultTag: "Trí tuệ nhân tạo"
    };
  }
  return {
    icon: GraduationCap,
    accentBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    gradient: "from-indigo-500 to-blue-600",
    badgeColor: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
    defaultTag: "Học phần"
  };
}

export default function QuizzesPage() {
  const { user } = useAuthStore();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [printingQuiz, setPrintingQuiz] = useState<any>(null);
  const [editingQuiz, setEditingQuiz] = useState<any>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"recommended" | "newest" | "questions" | "duration">("newest");
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [studentMsv, setStudentMsv] = useState<string>("");
  const [activeSubjectFilter, setActiveSubjectFilter] = useState<string | null>(null);

  // Load schedule for personalized quiz recommendations
  useEffect(() => {
    const msv = user?.student_id || (typeof window !== 'undefined' ? localStorage.getItem('openquiz_saved_msv') || '' : '');
    setStudentMsv(msv);
    if (msv) {
      fetch(`/api/schedule?msv=${encodeURIComponent(msv)}`)
        .then(r => r.json())
        .then(res => {
          if (res.success && res.data?.schedules?.length > 0) {
            setSchedules(res.data.schedules);
            setSortBy("recommended");
          }
        })
        .catch(err => console.warn("Lỗi tải lịch thi trong trang đề thi", err));
    }
  }, [user?.student_id]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('search') || '';
    if (q) {
      setSearch(q);
      setDebouncedSearch(q);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchQuizzes = async (query = debouncedSearch) => {
    setLoading(true);
    try {
      const url = query ? `/quizzes?search=${encodeURIComponent(query)}` : '/quizzes';
      const { data } = await api.get(url);
      if (data.success) {
        const quizzesList = Array.isArray(data.data) ? data.data : data.data.data;
        setQuizzes(quizzesList || []);
      }
    } catch (error) {
      console.error("Lỗi tải danh sách đề thi", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes(debouncedSearch);
  }, [debouncedSearch]);

  // Extract available categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    quizzes.forEach(q => {
      if (q.category?.name) set.add(q.category.name);
    });
    return Array.from(set);
  }, [quizzes]);

  // Filter and sort quizzes on frontend
  const processedQuizzes = useMemo(() => {
    let result = [...quizzes];

    if (selectedCategory !== "all") {
      result = result.filter(q => q.category?.name === selectedCategory);
    }

    if (activeSubjectFilter) {
      result = result.filter(q => isQuizMatchingSubject(q, activeSubjectFilter));
    }

    // Annotate quizzes with recommendation priorities based on exam schedule
    const annotated = rankQuizzesBySchedule(result, schedules);

    if (sortBy === "recommended") {
      return annotated; // Already sorted by recommendPriority desc, then id desc
    } else if (sortBy === "questions") {
      return [...annotated].sort((a, b) => (b.total_questions || 0) - (a.total_questions || 0));
    } else if (sortBy === "duration") {
      return [...annotated].sort((a, b) => (b.duration_minutes || 0) - (a.duration_minutes || 0));
    } else {
      // Default newest by id
      return [...annotated].sort((a, b) => b.id - a.id);
    }
  }, [quizzes, selectedCategory, activeSubjectFilter, sortBy, schedules]);

  const handleStartQuiz = (config: any) => {
    if (!selectedQuiz) return;
    const query = new URLSearchParams({
      mode: config.examMode,
      shuffleQ: config.shuffleQuestions ? '1' : '0',
      shuffleO: config.shuffleOptions ? '1' : '0',
      delay: config.autoNextDelay,
      unlimited: config.unlimitedTime ? '1' : '0',
      fresh: '1',
      limit: config.questionLimit ? String(config.questionLimit) : '0',
      theme: config.theme || 'modern'
    }).toString();
    
    router.push(`/play/${selectedQuiz.id}?${query}`);
    setSelectedQuiz(null);
  };

  const handleDeleteQuiz = async (e: React.MouseEvent, id: number, title: string) => {
    e.stopPropagation();
    if (window.confirm(`Bạn có chắc chắn muốn xóa đề thi "${title}"?`)) {
      try {
        const { data } = await api.delete(`/quizzes/${id}`);
        if (data.success) {
          fetchQuizzes();
        }
      } catch (error) {
        console.error("Lỗi khi xoá đề thi", error);
        alert("Xóa thất bại, vui lòng thử lại.");
      }
    }
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-500 pb-12">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-2 border-b border-border/40">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-xs">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Danh sách đề thi
              </h1>
              <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                {quizzes.length} bộ đề
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Khám phá, tra cứu và luyện tập với toàn bộ kho đề thi trắc nghiệm công khai.
            </p>
          </div>
        </div>

        <button 
          onClick={() => setShowImportModal(true)}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow-md active:scale-[0.98] shrink-0"
        >
          <FileUp className="w-4 h-4" /> 
          <span>Import Đề thi</span>
        </button>
      </div>

      {/* Filter and Search Controls Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Box */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Tìm kiếm theo tên đề thi"
            placeholder="Tìm kiếm theo tên đề thi, từ khóa..."
            className="w-full bg-card border border-border/80 rounded-xl pl-10 pr-9 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
          />
          {search && (
            <button 
              onClick={() => setSearch("")}
              aria-label="Xóa từ khóa tìm kiếm"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs p-1 rounded-full hover:bg-muted"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills & Sort Selector */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {categories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              <button
                onClick={() => setSelectedCategory("all")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                  selectedCategory === "all"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                Tất cả
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 bg-card border border-border/80 rounded-xl px-2.5 py-1.5 text-xs text-muted-foreground shrink-0 shadow-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-foreground font-medium focus:outline-none cursor-pointer pr-1"
              aria-label="Sắp xếp danh sách đề thi"
            >
              {schedules.length > 0 && (
                <option value="recommended">🎯 Theo lịch thi</option>
              )}
              <option value="newest">Mới nhất</option>
              <option value="questions">Nhiều câu nhất</option>
              <option value="duration">Thời lượng dài</option>
            </select>
          </div>
        </div>
      </div>

      {/* Student Exam Subject Quick-Filter Chips */}
      {schedules.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto py-1.5 scrollbar-none">
          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 shrink-0">
            <GraduationCap className="w-4 h-4 text-blue-500" />
            <span>Môn thi sắp tới:</span>
          </span>
          {schedules.map((s) => (
            <button
              key={s.subject}
              onClick={() => {
                if (activeSubjectFilter === s.subject) {
                  setActiveSubjectFilter(null);
                } else {
                  setActiveSubjectFilter(s.subject);
                }
              }}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5",
                activeSubjectFilter === s.subject
                  ? "bg-amber-500 text-white font-bold shadow-xs"
                  : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20"
              )}
              title={`Lọc đề thi môn ${s.subject}`}
            >
              <span>🎯 {s.subject}</span>
              {s.status === 'today' ? (
                <span className="text-[10px] bg-rose-500 text-white px-1 py-0.2 rounded font-bold">Hôm nay</span>
              ) : s.countdownText ? (
                <span className="text-[10px] opacity-75 font-normal">({s.countdownText})</span>
              ) : null}
            </button>
          ))}
          {activeSubjectFilter && (
            <button
              onClick={() => setActiveSubjectFilter(null)}
              className="text-xs text-muted-foreground hover:text-foreground underline whitespace-nowrap px-1"
            >
              Bỏ lọc môn
            </button>
          )}
        </div>
      )}

      {/* MSV Prompt Banner if not provided */}
      {!studentMsv && (
        <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-500/20 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-foreground">
                Cá nhân hóa theo lịch thi của bạn
              </p>
              <p className="text-xs text-muted-foreground">
                Nhập Mã sinh viên HUBT để hệ thống tự động ưu tiên các đề thi đúng môn theo lịch thi học kỳ của bạn lên đầu.
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/dashboard/settings')}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shrink-0 self-start sm:self-auto transition-colors"
          >
            Cài đặt MSV ngay
          </button>
        </div>
      )}

      {/* Quizzes Grid / Loading / Empty States */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="animate-pulse flex flex-col bg-card rounded-2xl overflow-hidden border border-border h-[220px]">
              <div className="h-1.5 bg-muted w-full" />
              <div className="p-6 flex-1 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted" />
                  <div className="h-5 bg-muted rounded-md flex-1" />
                </div>
                <div className="h-4 bg-muted rounded-md w-full" />
                <div className="h-4 bg-muted rounded-md w-2/3" />
                <div className="mt-auto flex justify-between items-center">
                  <div className="h-6 bg-muted rounded-md w-24" />
                  <div className="h-8 bg-muted rounded-xl w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : processedQuizzes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-card/50 rounded-2xl border border-dashed border-border/80">
          <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mb-5 text-primary">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            {search ? "Không tìm thấy đề thi phù hợp" : "Chưa có đề thi nào"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            {search 
              ? `Không có kết quả nào cho "${search}". Hãy thử tìm kiếm từ khóa khác.`
              : "Bạn chưa có bộ đề thi nào. Hãy tải lên file Word (.docx) hoặc dán văn bản để bắt đầu ôn thi."}
          </p>
          {search ? (
            <button 
              onClick={() => setSearch("")}
              className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl text-sm font-medium transition-colors"
            >
              Xóa bộ lọc tìm kiếm
            </button>
          ) : (
            <button 
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm"
            >
              <FileUp className="w-4 h-4" />
              <span>Tạo đề thi đầu tiên</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {processedQuizzes.map((quiz) => {
            const theme = getQuizTheme(quiz.title, quiz.category?.name);
            const coverImg = quiz.cover_image || (
              (quiz.title + " " + (quiz.category?.name || "")).toLowerCase().includes("java") ||
              (quiz.title + " " + (quiz.category?.name || "")).toLowerCase().includes("code") ||
              (quiz.title + " " + (quiz.category?.name || "")).toLowerCase().includes("mã nguồn")
                ? "/images/cover-code.jpg"
                : (quiz.title + " " + (quiz.category?.name || "")).toLowerCase().includes("mạng") ||
                  (quiz.title + " " + (quiz.category?.name || "")).toLowerCase().includes("qtm") ||
                  (quiz.title + " " + (quiz.category?.name || "")).toLowerCase().includes("đtdm")
                ? "/images/cover-network.jpg"
                : "/images/cover-exam.jpg"
            );

            const isOwner = Boolean(user?.id && (quiz.user_id === user.id || quiz.author?.id === user.id));
            const canManage = user?.role === 'admin' || isOwner;

            return (
              <div 
                key={quiz.id} 
                onClick={() => setSelectedQuiz(quiz)}
                className="group relative flex flex-col bg-card rounded-2xl border border-border/80 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden hover:-translate-y-1 cursor-pointer"
              >
                {/* TOP: Cover Image with overlay & badges */}
                <div className="h-40 w-full relative overflow-hidden bg-slate-900">
                  <img 
                    src={coverImg} 
                    alt={quiz.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

                  {/* Badges on Cover */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                    {quiz.isRecommended && quiz.matchedSubject && (
                      <span className="px-2.5 py-1 text-[11px] font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 backdrop-blur-md rounded-lg shadow-md border border-amber-300/40 flex items-center gap-1 animate-pulse">
                        <Sparkles className="w-3 h-3 fill-current" />
                        <span>Trùng môn: {quiz.matchedSubject.subject}</span>
                      </span>
                    )}
                    <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white bg-black/50 backdrop-blur-md rounded-lg border border-white/10 shadow-xs">
                      {quiz.category?.name || theme.defaultTag}
                    </span>
                    {isOwner ? (
                      <span className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-blue-300 bg-blue-950/70 backdrop-blur-md rounded-lg border border-blue-500/40">
                        Của bạn
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-300 bg-emerald-950/60 backdrop-blur-md rounded-lg border border-emerald-500/30">
                        Cơ bản
                      </span>
                    )}
                  </div>

                  {/* Action buttons (Top Right) - Only admin or owner can edit/delete */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all">
                    {canManage && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingQuiz(quiz); }}
                        className="p-2 bg-black/40 hover:bg-primary text-white/80 hover:text-white backdrop-blur-md rounded-full transition-all shadow-sm"
                        aria-label={`Chỉnh sửa đề thi ${quiz.title}`}
                        title="Chỉnh sửa câu hỏi & thông tin"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    {canManage && (
                      <button 
                        onClick={(e) => handleDeleteQuiz(e, quiz.id, quiz.title)}
                        className="p-2 bg-black/40 hover:bg-destructive text-white/80 hover:text-white backdrop-blur-md rounded-full transition-all shadow-sm"
                        aria-label={`Xóa đề thi ${quiz.title}`}
                        title={user?.role === 'admin' ? "Quản trị viên xóa đề thi" : "Xóa đề thi của bạn"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Bottom of Cover: Quick Stats */}
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white/90 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-md text-[11px] font-medium border border-white/10">
                        <FileQuestion className="w-3 h-3 text-blue-400" /> {quiz.total_questions || 0} câu
                      </span>
                      <span className="flex items-center gap-1 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-md text-[11px] font-medium border border-white/10">
                        <Clock className="w-3 h-3 text-amber-400" /> {quiz.duration_minutes || 60}m
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-emerald-300 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10">
                      Đạt {quiz.passing_score ? `${quiz.passing_score}%` : '80%'}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 
                      className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-1 tracking-tight" 
                      title={quiz.title}
                    >
                      {quiz.title}
                    </h3>

                    {/* Matched exam highlight note */}
                    {quiz.isRecommended && quiz.matchedSubject && (
                      <div className="mb-2 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                        <span>📅 Lịch thi: {quiz.matchedSubject.date} ({quiz.matchedSubject.time})</span>
                        {quiz.matchedSubject.countdownText && (
                          <span className="px-1.5 py-0.2 bg-amber-500/15 rounded text-[10px] font-bold">
                            {quiz.matchedSubject.countdownText}
                          </span>
                        )}
                      </div>
                    )}

                    <p className="text-[13px] text-muted-foreground line-clamp-2 leading-relaxed mb-4">
                      {quiz.description || "Bộ đề thi trắc nghiệm phục vụ luyện tập và củng cố kiến thức học phần."}
                    </p>
                  </div>

                  {/* Card Footer: Author with Avatar & CTA */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/50 mt-auto">
                    <div className="flex items-center gap-2 min-w-0">
                      <img 
                        src={quiz.author?.avatar || "/images/avatar-student.jpg"} 
                        alt="Avatar" 
                        className="w-6 h-6 rounded-full object-cover border border-border shrink-0" 
                      />
                      <span className="text-xs text-muted-foreground truncate max-w-[110px]">
                        {quiz.author?.name || "OpenQuiz"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {canManage && (
                        <button
                          title="Chỉnh sửa câu hỏi trong đề thi"
                          className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingQuiz(quiz);
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button 
                        title="Xem & In đề thi ra giấy"
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPrintingQuiz(quiz);
                        }}
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      <button 
                        className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs hover:shadow-md transition-all active:scale-95 group/btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedQuiz(quiz);
                        }}
                      >
                        <span>Luyện tập</span>
                        <Play className="w-3 h-3 fill-current transition-transform group-hover/btn:translate-x-0.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Render Modals */}
      <QuizSettingsModal 
        isOpen={!!selectedQuiz}
        onClose={() => setSelectedQuiz(null)}
        quizTitle={selectedQuiz?.title}
        totalQuestions={selectedQuiz?.total_questions || selectedQuiz?.questions_count}
        onConfirm={handleStartQuiz}
      />

      <ImportQuizModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => {
          setShowImportModal(false);
          fetchQuizzes();
        }}
      />

      <PrintQuizModal
        isOpen={!!printingQuiz}
        onClose={() => setPrintingQuiz(null)}
        quiz={printingQuiz}
      />

      <EditQuizModal
        isOpen={!!editingQuiz}
        onClose={() => setEditingQuiz(null)}
        quiz={editingQuiz}
        onUpdated={() => {
          fetchQuizzes();
        }}
      />
    </div>
  );
}
