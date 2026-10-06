"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  Play, 
  BookOpen, 
  Target, 
  Clock, 
  Flame,
  ChevronRight,
  Sparkles,
  HelpCircle,
  FileQuestion,
  TrendingUp,
  CheckCircle2,
  CalendarCheck,
  ArrowRight,
  MapPin,
  GraduationCap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { QuizSettingsModal } from "@/components/quiz/QuizSettingsModal";
import { rankQuizzesBySchedule, RecommendedQuiz } from "@/lib/quizRecommendations";

function getQuizThumbnail(title: string, categoryName?: string, coverImage?: string | null) {
  if (coverImage) return coverImage;
  const text = (title + " " + (categoryName || "")).toLowerCase();
  if (text.includes("java") || text.includes("code") || text.includes("mã nguồn") || text.includes("lập trình") || text.includes("python") || text.includes("web")) {
    return "/images/cover-code.jpg";
  }
  if (text.includes("mạng") || text.includes("qtm") || text.includes("đtdm") || text.includes("cloud") || text.includes("hệ thống")) {
    return "/images/cover-network.jpg";
  }
  return "/images/cover-exam.jpg";
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  
  const [stats, setStats] = useState({
    total_quizzes: 0,
    accuracy: 0,
    total_time_seconds: 0,
    streak_days: 0
  });
  const [history, setHistory] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<RecommendedQuiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [nextExam, setNextExam] = useState<any>(null);
  const [userMsv, setUserMsv] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  // 1. Khôi phục nhanh từ bộ nhớ đệm (Instant Render 0ms)
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem('openquiz_dashboard_data');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.stats) setStats(parsed.stats);
        if (parsed.history) setHistory(parsed.history);
        if (parsed.quizzes) setQuizzes(parsed.quizzes);
        if (parsed.nextExam) setNextExam(parsed.nextExam);
        setLoading(false);
      }
    } catch {
      // Bỏ qua lỗi parse cache
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      // Chỉ hiện skeleton nếu chưa có cache
      const hasCached = typeof window !== 'undefined' && !!sessionStorage.getItem('openquiz_dashboard_data');
      if (!hasCached) {
        setLoading(true);
      }

      try {
        const targetMsv = user?.student_id || (typeof window !== 'undefined' ? localStorage.getItem('openquiz_saved_msv') || '' : '');
        if (isMounted) setUserMsv(targetMsv);

        // Chạy song song cả tải lịch thi HUBT và dữ liệu Backend (tránh waterfall làm chậm web)
        const schedPromise = targetMsv
          ? fetch(`/api/schedule?msv=${encodeURIComponent(targetMsv)}`)
              .then(res => res.json())
              .catch(err => {
                console.warn("Lỗi tải lịch thi HUBT", err);
                return null;
              })
          : Promise.resolve(null);

        const corePromise = Promise.allSettled([
          api.get('/user/stats'),
          api.get('/user/history'),
          api.get('/quizzes')
        ]);

        const [coreResults, schedJson] = await Promise.all([corePromise, schedPromise]);

        if (!isMounted) return;

        let schedulesList: any[] = [];
        let nextExamData: any = null;

        if (schedJson?.success && schedJson.data?.schedules?.length > 0) {
          schedulesList = schedJson.data.schedules;

          // Helper tính timestamp chính xác từ chuỗi 'DD/MM/YYYY' và 'HHhMM'
          const parseExamTimestamp = (dateStr?: string, timeStr?: string) => {
            if (!dateStr) return Infinity;
            const parts = dateStr.split("/");
            if (parts.length !== 3) return Infinity;
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            let hours = 8, minutes = 0;
            if (timeStr) {
              const timeParts = timeStr.toLowerCase().replace("h", ":").split(":");
              hours = parseInt(timeParts[0], 10) || 8;
              minutes = parseInt(timeParts[1], 10) || 0;
            }
            return new Date(year, month, day, hours, minutes).getTime();
          };

          // 1. Ưu tiên số 1: Môn thi HÔM NAY (status === 'today')
          const todayExams = schedulesList
            .filter((s: any) => s.status === 'today')
            .sort((a: any, b: any) => parseExamTimestamp(a.date, a.time) - parseExamTimestamp(b.date, b.time));

          // 2. Ưu tiên số 2: Môn SẮP THI (status === 'upcoming') xếp theo ngày thi gần nhất đến xa nhất
          const upcomingExams = schedulesList
            .filter((s: any) => s.status === 'upcoming')
            .sort((a: any, b: any) => parseExamTimestamp(a.date, a.time) - parseExamTimestamp(b.date, b.time));

          // 3. Fallback: Môn đầu tiên nếu đã thi hết
          const topExam = todayExams[0] || upcomingExams[0] || schedulesList[0];

          nextExamData = {
            ...topExam,
            studentName: schedJson.data.student?.fullName || '',
            source: schedJson.data.source || 'HUBT ITC',
            total: schedulesList.length
          };
          setNextExam(nextExamData);
        }

        const [statsRes, historyRes, quizzesRes] = coreResults;
        let newStats = stats;
        let newHistory = history;
        let newQuizzes = quizzes;

        if (statsRes.status === 'fulfilled' && statsRes.value.data?.success) {
          newStats = statsRes.value.data.data;
          setStats(newStats);
        }
        if (historyRes.status === 'fulfilled' && historyRes.value.data?.success) {
          newHistory = historyRes.value.data.data.slice(0, 4);
          setHistory(newHistory);
        }
        if (quizzesRes.status === 'fulfilled' && quizzesRes.value.data?.success) {
          const rawList = Array.isArray(quizzesRes.value.data.data) 
            ? quizzesRes.value.data.data 
            : (quizzesRes.value.data.data?.data || []);
          const ranked = rankQuizzesBySchedule(rawList || [], schedulesList);
          newQuizzes = ranked.slice(0, 4);
          setQuizzes(newQuizzes);
        }

        // Lưu bản snapshot mới nhất vào cache để lần chuyển trang tiếp theo mở tức thì
        try {
          sessionStorage.setItem('openquiz_dashboard_data', JSON.stringify({
            stats: newStats,
            history: newHistory,
            quizzes: newQuizzes,
            nextExam: nextExamData
          }));
        } catch {}
      } catch (error) {
        console.error("Lỗi tải dữ liệu dashboard", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [user?.student_id]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 70) return "text-blue-700 dark:text-blue-400 bg-blue-500/10 border-blue-500/20";
    if (score >= 50) return "text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/20";
    return "text-rose-700 dark:text-rose-400 bg-rose-500/10 border-rose-500/20";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* Hero Section with 3D Illustration */}
      <div className="relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5 p-4 sm:p-7 md:p-8 rounded-2xl bg-gradient-to-br from-card via-card to-primary/5 border border-border shadow-sm">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-2 sm:mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Nền tảng ôn thi trắc nghiệm OpenQuiz</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-1.5 sm:mb-2">
            Chào mừng trở lại, {user?.name ? (user.name.includes('@') ? user.name.split('@')[0] : user.name).replace(/^\w/, c => c.toUpperCase()) : 'Học viên'}!
          </h2>
          <p className="text-muted-foreground text-xs sm:text-sm md:text-[15px] leading-relaxed mb-4 sm:mb-5">
            Tiếp tục hành trình học tập, rèn luyện kỹ năng và chuẩn bị cho các kỳ thi học phần với ngân hàng đề thi thông minh.
          </p>

          {/* Banner Thông báo Cá nhân hóa nếu chưa cài đặt MSV */}
          {!loading && !userMsv && (
            <div 
              onClick={() => router.push('/dashboard/settings')}
              className="mb-4 sm:mb-5 p-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/25 transition-all cursor-pointer flex items-center justify-between gap-3 group shadow-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <span>Cá nhân hóa theo lịch thi</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-400">Chưa cài MSV</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    Nhập Mã sinh viên trong Cài đặt để hệ thống tự động ưu tiên gợi ý các đề thi đúng môn bạn sắp thi!
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-blue-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 shrink-0">
                Cài đặt ngay <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button 
              onClick={() => router.push('/dashboard/quizzes')}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" /> Bắt đầu luyện thi
            </button>
            <button 
              onClick={() => router.push('/dashboard/bank')}
              className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-colors border border-border/60"
            >
              <BookOpen className="w-4 h-4" /> Ngân hàng câu hỏi
            </button>
          </div>
        </div>

        {/* 3D Learning Graphic Banner */}
        <div className="relative w-full md:w-72 lg:w-96 h-36 sm:h-48 md:h-52 rounded-xl sm:rounded-2xl overflow-hidden shrink-0 border border-border/80 shadow-md group">
          <img 
            src="/images/hero-learning.jpg" 
            alt="Học tập thông minh OpenQuiz" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />
          <div className="absolute bottom-2.5 left-2.5 text-white text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 drop-shadow">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Luyện tập thông minh mỗi ngày
          </div>
        </div>
      </div>

      {/* Statistics Cards - 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <div 
              key={i} 
              className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-card border border-border/80 animate-pulse flex flex-col justify-between h-[96px] sm:h-[116px]"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-muted/80 dark:bg-muted/40 shrink-0" />
                <div className="h-3.5 w-16 bg-muted/80 dark:bg-muted/40 rounded" />
              </div>
              <div className="flex items-baseline gap-2">
                <div className="h-7 sm:h-8 w-16 bg-muted/80 dark:bg-muted/40 rounded-md" />
                <div className="h-3 w-10 bg-muted/80 dark:bg-muted/40 rounded" />
              </div>
            </div>
          ))
        ) : (
          <>
            <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-card border border-border/80 hover:border-blue-500/40 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">Đã làm</span>
              </div>
              <div className="flex items-baseline gap-1.5 sm:gap-2">
                <div className="text-2xl sm:text-3xl font-bold text-foreground">{stats.total_quizzes}</div>
                <span className="text-[11px] sm:text-xs text-muted-foreground">bộ đề</span>
              </div>
            </div>
            
            <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-card border border-border/80 hover:border-emerald-500/40 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Target className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">Chính xác</span>
              </div>
              <div className="flex items-baseline gap-1.5 sm:gap-2">
                <div className="text-2xl sm:text-3xl font-bold text-foreground">{stats.accuracy}%</div>
                <span className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Chuẩn
                </span>
              </div>
            </div>

            <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-card border border-border/80 hover:border-amber-500/40 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">Thời gian</span>
              </div>
              <div className="flex items-baseline gap-1.5 sm:gap-2">
                <div className="text-2xl sm:text-3xl font-bold text-foreground">{formatTime(stats.total_time_seconds)}</div>
                <span className="text-[11px] sm:text-xs text-muted-foreground hidden sm:inline">tổng cộng</span>
              </div>
            </div>

            <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-card border border-border/80 hover:border-orange-500/40 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                  <Flame className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">Chuỗi ngày</span>
              </div>
              <div className="flex items-baseline gap-1.5 sm:gap-2">
                <div className="text-2xl sm:text-3xl font-bold text-foreground">{stats.streak_days}d</div>
                <span className="text-[10px] sm:text-xs text-orange-600 font-semibold">Liên tục 🔥</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Upcoming Exam Banner Widget */}
      {loading ? (
        <div className="relative overflow-hidden bg-card/70 border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-muted/80 dark:bg-muted/40 shrink-0" />
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="h-3.5 w-40 bg-muted/80 dark:bg-muted/40 rounded" />
                <div className="h-4 w-16 bg-muted/80 dark:bg-muted/40 rounded-full" />
              </div>
              <div className="h-5 sm:h-6 w-3/4 max-w-sm bg-muted/80 dark:bg-muted/40 rounded" />
              <div className="h-3.5 w-1/2 max-w-xs bg-muted/80 dark:bg-muted/40 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <div className="h-9 w-28 bg-muted/80 dark:bg-muted/40 rounded-xl" />
            <div className="h-9 w-24 bg-muted/80 dark:bg-muted/40 rounded-xl" />
          </div>
        </div>
      ) : nextExam ? (
        <div className={cn(
          "relative overflow-hidden rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 border transition-all",
          nextExam.status === 'today'
            ? "bg-gradient-to-r from-rose-950/40 via-amber-950/20 to-card border-rose-500/50 shadow-rose-950/20"
            : "bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-card border-blue-500/30"
        )}>
          <div className="flex items-center gap-3.5">
            <div className={cn(
              "w-12 h-12 rounded-xl text-white flex items-center justify-center shrink-0 shadow-md",
              nextExam.status === 'today'
                ? "bg-gradient-to-br from-rose-500 to-amber-600 shadow-rose-500/30 animate-pulse"
                : "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/25"
            )}>
              {nextExam.status === 'today' ? <Flame className="w-6 h-6 text-white" /> : <CalendarCheck className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn(
                  "text-xs font-bold uppercase tracking-wider",
                  nextExam.status === 'today' ? "text-rose-400" : "text-blue-400"
                )}>
                  {nextExam.status === 'today' ? "Lịch thi hôm nay • " : "Lịch thi học kỳ sắp tới • "}
                  {nextExam.source?.includes("Khoa CNTT") ? "Khoa CNTT - HUBT" : "HUBT ITC"}
                </span>
                {nextExam.status === 'today' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/25 text-rose-300 border border-rose-500/40 animate-pulse flex items-center gap-1">
                    🔥 HÔM NAY THI!
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {nextExam.countdownText || "Sắp thi"}
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-foreground mt-0.5">
                {nextExam.subject}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3 flex-wrap">
                <span>Phòng: <strong className="text-foreground">{nextExam.room}</strong></span>
                <span>•</span>
                <span>Ngày: <strong className="text-foreground">{nextExam.date}</strong> lúc <strong className="text-foreground">{nextExam.time}</strong></span>
                {nextExam.testScore !== null && (
                  <>
                    <span>•</span>
                    <span>Điểm KT: <strong className="text-emerald-400">{nextExam.testScore}/10</strong></span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              onClick={() => router.push(`/dashboard/quizzes?search=${encodeURIComponent(nextExam.searchKeyword || nextExam.subject)}`)}
              className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Ôn thi môn này</span>
            </button>
            <button
              onClick={() => router.push('/dashboard/schedule')}
              className="px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <span>Xem tất cả ({nextExam.total})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-950/40 via-indigo-950/20 to-card border border-blue-500/30 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/25">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  Cá nhân hóa theo lịch thi
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Tự động ưu tiên đề thi
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                Tự động ưu tiên đề thi theo lịch thi học kỳ của bạn
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
                Nhập Mã sinh viên trong Cài đặt để hệ thống tự động ưu tiên gợi ý các đề thi đúng môn bạn sắp thi!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
            <button
              onClick={() => router.push('/dashboard/settings')}
              className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Cài đặt MSV ngay</span>
            </button>
            <button
              onClick={() => router.push('/dashboard/schedule')}
              className="px-3.5 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <span>Tra cứu nhanh</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Activity Timeline */}
        <div className="col-span-1 lg:col-span-2 bg-card rounded-2xl border border-border/80 p-6 flex flex-col shadow-xs">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-border/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Hoạt động gần đây</h3>
            </div>
            <button 
              className="text-xs font-semibold text-primary hover:underline transition-colors flex items-center gap-1" 
              onClick={() => router.push('/dashboard/history')}
            >
              Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <div className="flex-1">
            {loading ? (
              <div className="space-y-3.5">
                {[1, 2, 3, 4].map((i) => (
                  <div 
                    key={i}
                    className="animate-pulse flex items-center justify-between p-3.5 rounded-xl border border-border/70 bg-card/60"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-muted/80 dark:bg-muted/40 shrink-0" />
                      <div className="space-y-2 flex-1 min-w-0 pr-3">
                        <div className="h-4 bg-muted/80 dark:bg-muted/40 rounded w-3/5 max-w-[220px]" />
                        <div className="h-3 bg-muted/80 dark:bg-muted/40 rounded w-2/5 max-w-[150px]" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <div className="w-16 h-6 bg-muted/80 dark:bg-muted/40 rounded-lg" />
                      <div className="w-4 h-4 bg-muted/80 dark:bg-muted/40 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-12 text-center">
                <Clock className="w-10 h-10 mb-3 opacity-30 text-primary" />
                <p className="font-semibold text-foreground">Chưa có bài thi nào</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">Hãy bắt đầu ôn luyện ngay để theo dõi tiến độ</p>
                <button 
                  onClick={() => router.push('/dashboard/quizzes')}
                  className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-xl transition-colors"
                >
                  Khám phá kho đề thi
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((h) => {
                  const scoreColor = getScoreColor(h.score);
                  const dateObj = new Date(h.created_at);
                  const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
                  
                  return (
                    <div 
                      key={h.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => router.push(`/result/${h.id || h.attempt_id}`)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/result/${h.id || h.attempt_id}`); } }}
                      className="group flex items-center justify-between p-3.5 rounded-xl border border-border/70 bg-card hover:border-primary/40 hover:bg-accent/40 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Thumbnail / Indicator */}
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 font-bold">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors" title={h.quiz?.title}>
                            {h.quiz?.title || "Đề thi đã bị xóa"}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span>{dateStr} lúc {timeStr}</span>
                            <span>•</span>
                            <span>Đúng {h.correct_answers} / {h.total_questions || h.quiz?.total_questions || (h.correct_answers + (h.wrong_answers || 0) + (h.skipped_answers || 0))} câu</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        <span className={cn("text-xs font-bold px-2.5 py-1 rounded-lg border", scoreColor)}>
                          {h.score} pts
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recommended Quizzes with Cover Thumbnails */}
        <div className="col-span-1 bg-card rounded-2xl border border-border/80 p-6 flex flex-col shadow-xs">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="text-lg font-bold text-foreground">Gợi ý cho bạn</h3>
            </div>
            <button 
              onClick={() => router.push('/dashboard/quizzes')}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Xem kho đề
            </button>
          </div>

          <div className="flex-1 flex flex-col gap-3.5">
            {loading ? (
              [1, 2, 3, 4].map((i) => (
                <div 
                  key={i}
                  className="animate-pulse flex items-center gap-3.5 p-3 rounded-xl border border-border/70 bg-card/60 overflow-hidden"
                >
                  <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl bg-muted/80 dark:bg-muted/40 shrink-0" />
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="h-3.5 bg-muted/80 dark:bg-muted/40 rounded w-16" />
                    <div className="h-4 bg-muted/80 dark:bg-muted/40 rounded w-4/5 max-w-[180px]" />
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="h-3 bg-muted/80 dark:bg-muted/40 rounded w-12" />
                      <div className="h-3 bg-muted/80 dark:bg-muted/40 rounded w-12" />
                    </div>
                  </div>
                </div>
              ))
            ) : quizzes.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-10 text-center">
                <BookOpen className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">Chưa có đề thi gợi ý</p>
              </div>
            ) : quizzes.map((q) => {
              const coverImg = getQuizThumbnail(q.title, q.category?.name, q.cover_image);

              return (
                <div 
                  key={q.id} 
                  role="button"
                  tabIndex={0}
                  className={cn(
                    "group flex items-center gap-3.5 p-3 rounded-xl border transition-all cursor-pointer overflow-hidden",
                    q.isRecommended
                      ? "border-amber-500/40 bg-gradient-to-r from-amber-500/[0.04] to-orange-500/[0.02] hover:border-amber-500 hover:shadow-md hover:shadow-amber-500/5"
                      : "border-border/70 bg-card hover:border-primary/40 hover:bg-accent/40"
                  )}
                  onClick={() => setSelectedQuiz(q)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedQuiz(q); } }}
                >
                  {/* Thumbnail Cover Image */}
                  <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden shrink-0 border border-border/60 relative bg-muted">
                    <img 
                      src={coverImg} 
                      alt={q.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {q.isRecommended && (
                      <div className="absolute top-1 left-1 bg-amber-500 text-white p-1 rounded-md shadow-xs" title="Gợi ý theo lịch thi">
                        <Sparkles className="w-2.5 h-2.5 fill-current" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {q.isRecommended && q.matchedSubject ? (
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                          <Sparkles className="w-2.5 h-2.5 text-amber-500 fill-amber-500 shrink-0" />
                          <span className="truncate max-w-[140px]">Thi: {q.matchedSubject.subject}</span>
                        </span>
                        {q.matchedSubject.countdownText && (
                          <span className="text-[10px] font-medium text-amber-600/80 dark:text-amber-400/80 hidden sm:inline">
                            {q.matchedSubject.countdownText}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary uppercase">
                          {q.category?.name || 'Tự do'}
                        </span>
                      </div>
                    )}
                    <h4 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors" title={q.title}>
                      {q.title}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5">
                      <span className="flex items-center gap-1">
                        <FileQuestion className="w-3.5 h-3.5 text-primary" /> {q.total_questions || 0} câu
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-500" /> {q.duration_minutes || 60}m
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      <QuizSettingsModal 
        isOpen={!!selectedQuiz}
        onClose={() => setSelectedQuiz(null)}
        quizTitle={selectedQuiz?.title}
        totalQuestions={selectedQuiz?.total_questions || selectedQuiz?.questions_count}
        onConfirm={(config) => {
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
        }}
      />
    </div>
  );
}
