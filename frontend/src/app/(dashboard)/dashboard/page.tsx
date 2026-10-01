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
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { QuizSettingsModal } from "@/components/quiz/QuizSettingsModal";

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
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, historyRes, quizzesRes] = await Promise.all([
          api.get('/user/stats'),
          api.get('/user/history'),
          api.get('/quizzes')
        ]);
        
        if (statsRes.data.success) setStats(statsRes.data.data);
        if (historyRes.data.success) setHistory(historyRes.data.data.slice(0, 4));
        if (quizzesRes.data.success) {
          const quizzesList = Array.isArray(quizzesRes.data.data) ? quizzesRes.data.data : quizzesRes.data.data.data;
          setQuizzes(quizzesList.slice(0, 3));
        }
      } catch (error) {
        console.error("Lỗi tải dữ liệu dashboard", error);
      }
    };
    fetchData();
  }, []);

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
      <div className="relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 p-7 sm:p-8 rounded-2xl bg-gradient-to-br from-card via-card to-primary/5 border border-border shadow-sm">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Nền tảng ôn thi trắc nghiệm EduQuiz</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2">
            Chào mừng trở lại, {user?.name ? (user.name.includes('@') ? user.name.split('@')[0] : user.name).replace(/^\w/, c => c.toUpperCase()) : 'Học viên'}!
          </h2>
          <p className="text-muted-foreground text-sm sm:text-[15px] leading-relaxed mb-6">
            Tiếp tục hành trình học tập, rèn luyện kỹ năng và chuẩn bị cho các kỳ thi học phần với ngân hàng đề thi thông minh.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <button 
              onClick={() => router.push('/dashboard/quizzes')}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" /> Bắt đầu luyện thi
            </button>
            <button 
              onClick={() => router.push('/dashboard/bank')}
              className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2.5 rounded-xl font-medium text-sm transition-colors border border-border/60"
            >
              <BookOpen className="w-4 h-4" /> Ngân hàng câu hỏi
            </button>
          </div>
        </div>

        {/* 3D Learning Graphic Banner */}
        <div className="relative w-full md:w-72 lg:w-96 h-48 md:h-52 rounded-2xl overflow-hidden shrink-0 border border-border/80 shadow-md group">
          <img 
            src="/images/hero-learning.jpg" 
            alt="Học tập thông minh EduQuiz" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />
          <div className="absolute bottom-3 left-3 text-white text-xs font-semibold flex items-center gap-1.5 drop-shadow">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Luyện tập thông minh mỗi ngày
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-card border border-border/80 hover:border-blue-500/40 hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tổng đề đã làm</span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold text-foreground">{stats.total_quizzes}</div>
            <span className="text-xs text-muted-foreground">bộ đề</span>
          </div>
        </div>
        
        <div className="p-5 rounded-2xl bg-card border border-border/80 hover:border-emerald-500/40 hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Độ chính xác TB</span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold text-foreground">{stats.accuracy}%</div>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> Chuẩn hóa
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border/80 hover:border-amber-500/40 hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Thời gian rèn luyện</span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold text-foreground">{formatTime(stats.total_time_seconds)}</div>
            <span className="text-xs text-muted-foreground">tổng cộng</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border/80 hover:border-orange-500/40 hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Chuỗi học tập</span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold text-foreground">{stats.streak_days} ngày</div>
            <span className="text-xs text-orange-600 font-semibold">Liên tục 🔥</span>
          </div>
        </div>
      </div>

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
            {history.length === 0 ? (
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
            {quizzes.length === 0 ? (
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
                  className="group flex items-center gap-3.5 p-3 rounded-xl border border-border/70 bg-card hover:border-primary/40 hover:bg-accent/40 transition-all cursor-pointer overflow-hidden"
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
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary uppercase">
                        {q.category?.name || 'Tự do'}
                      </span>
                    </div>
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
        onConfirm={(config) => {
          const query = new URLSearchParams({
            mode: config.examMode,
            shuffleQ: config.shuffleQuestions ? '1' : '0',
            shuffleO: config.shuffleOptions ? '1' : '0',
            delay: config.autoNextDelay,
            unlimited: config.unlimitedTime ? '1' : '0',
            fresh: '1'
          }).toString();
          router.push(`/play/${selectedQuiz.id}?${query}`);
          setSelectedQuiz(null);
        }}
      />
    </div>
  );
}
