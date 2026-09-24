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
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { QuizSettingsModal } from "@/components/quiz/QuizSettingsModal";

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
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-[20px] bg-gradient-to-r from-blue-50/70 via-card to-indigo-50/40 dark:from-[#0f172a] dark:to-[#071026] border border-border relative overflow-hidden shadow-xs">
        {/* Ambient glow - Optimized for GPU */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none opacity-50 dark:opacity-100" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)' }}></div>
        
        <div className="relative z-10">
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-2">
            Chào mừng trở lại, {user?.name ? (user.name.includes('@') ? user.name.split('@')[0] : user.name).replace(/^\w/, c => c.toUpperCase()) : 'Học viên'}! 👋
          </h2>
          <p className="text-muted-foreground text-[15px]">
            Tiếp tục hành trình học tập của bạn hôm nay. Bạn đang làm rất tốt!
          </p>
        </div>
        <button 
          onClick={() => router.push('/dashboard/quizzes')}
          className="relative z-10 shrink-0 flex items-center gap-2 bg-[#4F7CFF] hover:bg-[#6D91FF] text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-[0_4px_12px_rgba(79,124,255,0.3)] hover:shadow-[0_6px_16px_rgba(79,124,255,0.4)] hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Sparkles className="w-4 h-4" /> Bắt đầu học
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-[20px] bg-card border border-border hover:border-border hover:-translate-y-[3px] transition-all duration-250 group">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Tổng đề thi</span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold text-foreground">{stats.total_quizzes}</div>
            <span className="text-xs font-medium text-emerald-400">+5 tuần này</span>
          </div>
        </div>
        
        <div className="p-6 rounded-[20px] bg-card border border-border hover:border-border hover:-translate-y-[3px] transition-all duration-250 group">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Target className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Điểm trung bình</span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold text-foreground">{stats.accuracy}%</div>
            <span className="text-xs font-medium text-emerald-400">+4%</span>
          </div>
        </div>

        <div className="p-6 rounded-[20px] bg-card border border-border hover:border-border hover:-translate-y-[3px] transition-all duration-250 group">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Thời gian học</span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold text-foreground">{formatTime(stats.total_time_seconds)}</div>
            <span className="text-xs font-medium text-muted-foreground">Tháng này</span>
          </div>
        </div>

        <div className="p-6 rounded-[20px] bg-card border border-border hover:border-border hover:-translate-y-[3px] transition-all duration-250 group">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
              <Flame className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Chuỗi học tập</span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold text-foreground">{stats.streak_days} ngày</div>
            <span className="text-xs font-medium text-orange-400">Tuyệt vời!</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Activity Timeline */}
        <div className="col-span-1 lg:col-span-2 bg-card rounded-[20px] border border-border p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-foreground">Hoạt động gần đây</h3>
            <button className="text-sm font-medium text-[#4F7CFF] hover:text-[#6D91FF] transition-colors flex items-center gap-1" onClick={() => router.push('/dashboard/history')}>
              Xem tất cả <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1">
            {history.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-10">
                <Clock className="w-10 h-10 mb-3 opacity-20" />
                <p>Chưa có hoạt động nào.</p>
              </div>
            ) : (
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-800 before:to-transparent">
                {history.map((h, i) => {
                  const scoreColor = getScoreColor(h.score);
                  const dateObj = new Date(h.created_at);
                  const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
                  
                  return (
                    <div key={h.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      {/* Timeline dot */}
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#0f172a] bg-muted text-muted-foreground group-hover:text-foreground group-hover:bg-[#4F7CFF] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm transition-colors z-10">
                        <CheckCircleIcon />
                      </div>
                      
                      {/* Content Card */}
                      <div 
                        role="button"
                        tabIndex={0}
                        onClick={() => router.push(`/result/${h.id || h.attempt_id}`)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/result/${h.id || h.attempt_id}`); } }}
                        className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border bg-card hover:bg-muted/50 hover:border-primary/40 transition-all cursor-pointer group/card focus-visible:ring-2 focus-visible:ring-primary shadow-xs"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-muted-foreground">{dateStr} • {timeStr}</span>
                          <span className={cn("text-xs font-bold px-2 py-1 rounded-md border", scoreColor)}>
                            {h.score} pts
                          </span>
                        </div>
                        <h4 className="text-[15px] font-semibold text-foreground line-clamp-1 mb-1 group-hover/card:text-primary transition-colors">
                          {h.quiz?.title || "Đề thi đã bị xóa"}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Đúng {h.correct_answers} / {h.total_questions || h.quiz?.total_questions || (h.correct_answers + (h.wrong_answers || 0) + (h.skipped_answers || 0))} câu
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recommended Quizzes */}
        <div className="col-span-1 bg-card rounded-[20px] border border-border p-6 flex flex-col shadow-xs">
          <h3 className="text-xl font-bold text-foreground mb-6">Gợi ý cho bạn</h3>
          <div className="flex-1 flex flex-col gap-3">
            {quizzes.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-10">
                <p>Không có đề thi nào.</p>
              </div>
            ) : quizzes.map((q) => (
              <div 
                key={q.id} 
                role="button"
                tabIndex={0}
                className="group flex flex-col p-4 rounded-xl border border-border bg-card hover:bg-muted/60 hover:border-primary/30 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-primary shadow-xs"
                onClick={() => setSelectedQuiz(q)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedQuiz(q); } }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                    {q.title.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[15px] font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {q.title}
                    </h4>
                    <p className="text-[13px] text-muted-foreground truncate">
                      {q.category?.name || 'Tự do'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[13px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" /> {q.total_questions} câu
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> {q.duration_minutes} phút
                  </div>
                </div>
              </div>
            ))}
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
            unlimited: config.unlimitedTime ? '1' : '0'
          }).toString();
          router.push(`/play/${selectedQuiz.id}?${query}`);
          setSelectedQuiz(null);
        }}
      />
    </div>
  );
}

function CheckCircleIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
