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
  Printer, 
  ShieldCheck, 
  Layers, 
  FolderPlus,
  UserCheck
} from "lucide-react";

import { QuizSettingsModal } from "@/components/quiz/QuizSettingsModal";
import { ImportQuizModal } from "@/components/quiz/ImportQuizModal";
import { PrintQuizModal } from "@/components/quiz/PrintQuizModal";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

// Helper theme styling
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

export default function MyQuizzesPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminViewAll, setAdminViewAll] = useState(false);

  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [printingQuiz, setPrintingQuiz] = useState<any>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "questions" | "duration">("newest");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchQuizzes = async (query = debouncedSearch, isViewAll = adminViewAll) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append("search", query);

      // Nếu là admin và đang chọn xem toàn bộ hệ thống
      if (user?.role === "admin" && isViewAll) {
        params.append("admin_all", "1");
      } else {
        // Mặc định: chỉ lấy đề của chính tài khoản đăng nhập
        params.append("mine", "1");
      }

      const { data } = await api.get(`/quizzes?${params.toString()}`);
      if (data.success) {
        const quizzesList = Array.isArray(data.data) ? data.data : data.data.data;
        setQuizzes(quizzesList || []);
      }
    } catch (error) {
      console.error("Lỗi tải đề thi của tôi", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchQuizzes(debouncedSearch, adminViewAll);
    }
  }, [debouncedSearch, adminViewAll, user]);

  // Danh sách thể loại
  const categories = useMemo(() => {
    const set = new Set<string>();
    quizzes.forEach((q) => {
      if (q.category?.name) set.add(q.category.name);
    });
    return Array.from(set);
  }, [quizzes]);

  // Lọc và sắp xếp
  const processedQuizzes = useMemo(() => {
    let result = [...quizzes];

    if (selectedCategory !== "all") {
      result = result.filter((q) => q.category?.name === selectedCategory);
    }

    if (sortBy === "questions") {
      result.sort((a, b) => (b.total_questions || 0) - (a.total_questions || 0));
    } else if (sortBy === "duration") {
      result.sort((a, b) => (b.duration_minutes || 0) - (a.duration_minutes || 0));
    } else {
      result.sort((a, b) => b.id - a.id);
    }

    return result;
  }, [quizzes, selectedCategory, sortBy]);

  const handleStartQuiz = (config: any) => {
    if (!selectedQuiz) return;
    const query = new URLSearchParams({
      mode: config.examMode,
      shuffleQ: config.shuffleQuestions ? "1" : "0",
      shuffleO: config.shuffleOptions ? "1" : "0",
      delay: config.autoNextDelay,
      unlimited: config.unlimitedTime ? "1" : "0",
      fresh: "1",
      limit: config.questionLimit ? String(config.questionLimit) : '0',
      theme: config.theme || 'modern'
    }).toString();

    router.push(`/play/${selectedQuiz.id}?${query}`);
    setSelectedQuiz(null);
  };

  const handleDeleteQuiz = async (e: React.MouseEvent, id: number, title: string) => {
    e.stopPropagation();
    if (window.confirm(`Bạn có chắc chắn muốn xóa bộ đề thi "${title}"?`)) {
      try {
        const { data } = await api.delete(`/quizzes/${id}`);
        if (data.success) {
          fetchQuizzes(debouncedSearch, adminViewAll);
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
            <Library className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Đề thi của tôi
              </h1>
              <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                {quizzes.length} bộ đề
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {user?.role === "admin" && adminViewAll
                ? "Chế độ Quản trị: Toàn quyền kiểm soát và quản lý tất cả các đề thi trong hệ thống."
                : "Quản lý và luyện tập với những bộ đề thi trắc nghiệm do chính bạn tạo hoặc tải lên."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Admin Control Switch */}
          {user?.role === "admin" && (
            <div className="flex items-center bg-card border border-border rounded-xl p-1 shadow-xs">
              <button
                onClick={() => setAdminViewAll(false)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  !adminViewAll
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Đề của tôi ({user.name})
              </button>
              <button
                onClick={() => setAdminViewAll(true)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all",
                  adminViewAll
                    ? "bg-rose-500 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Kiểm soát toàn hệ thống
              </button>
            </div>
          )}

          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow-md active:scale-[0.98] shrink-0"
          >
            <FileUp className="w-4 h-4" />
            <span>Tạo / Import Đề thi</span>
          </button>
        </div>
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
            aria-label="Tìm kiếm trong đề thi của tôi"
            placeholder="Tìm kiếm theo tên đề thi, từ khóa..."
            className="w-full bg-card border border-border/80 rounded-xl pl-10 pr-9 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              aria-label="Xóa từ khóa tìm kiếm"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter and Sort Dropdowns */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto w-full sm:w-auto">
          {categories.length > 0 && (
            <div className="relative flex-1 sm:flex-initial">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="Lọc theo thể loại"
                className="w-full sm:w-auto appearance-none bg-card border border-border/80 rounded-xl px-3.5 py-2 pr-8 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer shadow-xs"
              >
                <option value="all">Tất cả môn học</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <Filter className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          )}

          <div className="relative flex-1 sm:flex-initial">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              aria-label="Sắp xếp theo thứ tự"
              className="w-full sm:w-auto appearance-none bg-card border border-border/80 rounded-xl px-3.5 py-2 pr-8 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer shadow-xs"
            >
              <option value="newest">Mới nhất</option>
              <option value="questions">Số câu hỏi</option>
              <option value="duration">Thời gian thi</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Grid of Quizzes */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-card rounded-2xl border border-border p-4 space-y-4 animate-pulse"
            >
              <div className="h-40 bg-muted rounded-xl" />
              <div className="h-5 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : processedQuizzes.length === 0 ? (
        <div className="text-center py-16 px-4 bg-card rounded-2xl border border-dashed border-border/80 flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <FileQuestion className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="text-lg font-bold text-foreground">
              {search
                ? "Không tìm thấy bộ đề phù hợp"
                : user?.role === "admin" && adminViewAll
                ? "Chưa có đề thi nào trong hệ thống"
                : "Bạn chưa tải lên đề thi nào"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {search
                ? `Không có bộ đề nào khớp với từ khóa "${search}". Vui lòng thử từ khóa khác.`
                : "Tải lên tài liệu Word (.docx) hoặc dán văn bản trắc nghiệm để hệ thống tự động nhận diện và tạo bộ đề cho riêng bạn."}
            </p>
          </div>
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
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow-md"
            >
              <FileUp className="w-4 h-4" />
              <span>Tải lên bộ đề đầu tiên</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {processedQuizzes.map((quiz) => {
            const theme = getQuizTheme(quiz.title, quiz.category?.name);
            const coverImg =
              quiz.cover_image ||
              ((quiz.title + " " + (quiz.category?.name || ""))
                .toLowerCase()
                .includes("java") ||
              (quiz.title + " " + (quiz.category?.name || ""))
                .toLowerCase()
                .includes("code") ||
              (quiz.title + " " + (quiz.category?.name || ""))
                .toLowerCase()
                .includes("mã nguồn")
                ? "/images/cover-code.jpg"
                : (quiz.title + " " + (quiz.category?.name || ""))
                    .toLowerCase()
                    .includes("mạng") ||
                  (quiz.title + " " + (quiz.category?.name || ""))
                    .toLowerCase()
                    .includes("qtm") ||
                  (quiz.title + " " + (quiz.category?.name || ""))
                    .toLowerCase()
                    .includes("đtdm")
                ? "/images/cover-network.jpg"
                : "/images/cover-exam.jpg");

            const isOwner = Boolean(
              user?.id && (quiz.user_id === user.id || quiz.author?.id === user.id)
            );
            const canManage = user?.role === "admin" || isOwner;

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
                    <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white bg-black/50 backdrop-blur-md rounded-lg border border-white/10 shadow-xs">
                      {quiz.category?.name || theme.defaultTag}
                    </span>
                    {isOwner ? (
                      <span className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-blue-300 bg-blue-950/70 backdrop-blur-md rounded-lg border border-blue-500/40">
                        Của bạn
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-300 bg-amber-950/70 backdrop-blur-md rounded-lg border border-amber-500/40">
                        {quiz.author?.name || "Người dùng"}
                      </span>
                    )}
                  </div>

                  {/* Delete button (Top Right) */}
                  {canManage && (
                    <button
                      onClick={(e) => handleDeleteQuiz(e, quiz.id, quiz.title)}
                      className="absolute top-3 right-3 p-2 bg-black/40 hover:bg-destructive text-white/80 hover:text-white backdrop-blur-md rounded-full transition-all opacity-90 sm:opacity-0 group-hover:opacity-100 shadow-sm"
                      aria-label={`Xóa đề thi ${quiz.title}`}
                      title={
                        user?.role === "admin" && !isOwner
                          ? "Quản trị viên xóa đề thi này"
                          : "Xóa đề thi của bạn"
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  {/* Bottom of Cover: Quick Stats */}
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white/90 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-md text-[11px] font-medium border border-white/10">
                        <FileQuestion className="w-3 h-3 text-blue-400" />{" "}
                        {quiz.total_questions || 0} câu
                      </span>
                      <span className="flex items-center gap-1 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-md text-[11px] font-medium border border-white/10">
                        <Clock className="w-3 h-3 text-amber-400" />{" "}
                        {quiz.duration_minutes || 60}m
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-emerald-300 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10">
                      Đạt {quiz.passing_score ? `${quiz.passing_score}%` : "80%"}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3
                      className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-1.5 tracking-tight"
                      title={quiz.title}
                    >
                      {quiz.title}
                    </h3>
                    <p className="text-[13px] text-muted-foreground line-clamp-2 leading-relaxed mb-4">
                      {quiz.description ||
                        "Bộ đề thi trắc nghiệm phục vụ luyện tập và củng cố kiến thức học phần."}
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
                        {quiz.author?.name || "EduQuiz"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        title="Xem & In đề thi ra giấy"
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPrintingQuiz(quiz);
                        }}
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedQuiz(quiz);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs transition-all shadow-xs hover:shadow active:scale-[0.98]"
                      >
                        <span>Luyện tập</span>
                        <Play className="w-3 h-3 fill-current" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Start Quiz Settings Modal */}
      <QuizSettingsModal
        isOpen={!!selectedQuiz}
        onClose={() => setSelectedQuiz(null)}
        quizTitle={selectedQuiz?.title}
        totalQuestions={selectedQuiz?.total_questions || selectedQuiz?.questions_count}
        onConfirm={handleStartQuiz}
      />

      {/* Import / Upload Modal */}
      <ImportQuizModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => {
          setShowImportModal(false);
          fetchQuizzes(debouncedSearch, adminViewAll);
        }}
      />

      {/* Print Exam Sheet Modal */}
      {printingQuiz && (
        <PrintQuizModal
          isOpen={!!printingQuiz}
          quiz={printingQuiz}
          onClose={() => setPrintingQuiz(null)}
        />
      )}
    </div>
  );
}
