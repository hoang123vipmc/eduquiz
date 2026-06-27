"use client";

import React, { useEffect, useState } from "react";
import { Trophy, Medal, Target, Award, Loader2, Sparkles, User as UserIcon } from "lucide-react";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";

interface LeaderboardUser {
  id: number;
  name: string;
  avatar: string | null;
  total_correct: number;
  total_quizzes: number;
  avg_accuracy: number;
  rank: number | string;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [currentUser, setCurrentUser] = useState<LeaderboardUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data } = await api.get('/leaderboard');
        if (data.success) {
          setLeaderboard(data.data.leaderboard);
          setCurrentUser(data.data.current_user);
        }
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const getRankStyle = (rank: number | string) => {
    if (rank === 1) return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.2)]";
    if (rank === 2) return "bg-slate-300/10 text-slate-400 border-slate-300/20";
    if (rank === 3) return "bg-amber-700/10 text-amber-600 border-amber-700/20";
    return "bg-muted text-muted-foreground border-transparent";
  };

  const getRankIcon = (rank: number | string) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="font-bold text-sm">{rank}</span>;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Đang tải bảng xếp hạng...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              Bảng xếp hạng <Sparkles className="w-5 h-5 text-yellow-500" />
            </h1>
            <p className="text-muted-foreground text-sm">Vinh danh những người có thành tích học tập xuất sắc nhất</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm relative">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-border bg-muted/50 text-sm font-semibold text-muted-foreground">
          <div className="col-span-2 md:col-span-1 text-center">Hạng</div>
          <div className="col-span-5 md:col-span-4 pl-2">Người dùng</div>
          <div className="col-span-5 md:col-span-3 text-center">Câu đúng</div>
          <div className="hidden md:block col-span-2 text-center">Đã làm</div>
          <div className="hidden md:block col-span-2 text-center">Chính xác</div>
        </div>

        {/* List */}
        <div className="divide-y divide-border">
          {leaderboard.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              Chưa có ai tham gia làm bài.
            </div>
          ) : (
            leaderboard.map((user) => (
              <div 
                key={user.id} 
                className={cn(
                  "grid grid-cols-12 gap-4 p-4 items-center transition-colors hover:bg-muted/30",
                  currentUser?.id === user.id ? "bg-primary/5 border-l-2 border-primary" : ""
                )}
              >
                <div className="col-span-2 md:col-span-1 flex justify-center">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center border", getRankStyle(user.rank))}>
                    {getRankIcon(user.rank)}
                  </div>
                </div>
                
                <div className="col-span-5 md:col-span-4 flex items-center gap-3 pl-2 truncate">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover shrink-0 border border-border" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border text-muted-foreground">
                      <UserIcon className="w-5 h-5" />
                    </div>
                  )}
                  <span className={cn("font-medium truncate", user.rank === 1 ? "text-yellow-500 font-bold" : "text-foreground")}>
                    {user.name}
                  </span>
                </div>

                <div className="col-span-5 md:col-span-3 flex items-center justify-center gap-1">
                  <Target className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-bold text-foreground text-lg">{user.total_correct}</span>
                </div>

                <div className="hidden md:flex col-span-2 items-center justify-center">
                  <span className="text-muted-foreground font-medium">{user.total_quizzes} bài</span>
                </div>

                <div className="hidden md:flex col-span-2 items-center justify-center gap-1">
                  <Award className={cn("w-4 h-4", user.avg_accuracy >= 80 ? "text-primary" : "text-muted-foreground")} />
                  <span className="font-semibold text-foreground">{user.avg_accuracy}%</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Current User Sticky Bar */}
        {currentUser && (
          <div className="sticky bottom-0 border-t border-border bg-card p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
            <div className="text-xs text-muted-foreground mb-2 flex items-center justify-between">
              <span>Thành tích của bạn</span>
              {currentUser.rank !== '-' && Number(currentUser.rank) > 50 && (
                <span className="text-primary">Bạn đang ở vị trí #{currentUser.rank}</span>
              )}
            </div>
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-2 md:col-span-1 flex justify-center">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center border", getRankStyle(currentUser.rank))}>
                  {getRankIcon(currentUser.rank)}
                </div>
              </div>
              
              <div className="col-span-5 md:col-span-4 flex items-center gap-3 pl-2 truncate">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-10 h-10 rounded-full object-cover shrink-0 border border-primary/30" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/30 text-primary">
                    <UserIcon className="w-5 h-5" />
                  </div>
                )}
                <span className="font-bold text-foreground truncate">{currentUser.name} (Bạn)</span>
              </div>

              <div className="col-span-5 md:col-span-3 flex items-center justify-center gap-1">
                <Target className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="font-bold text-foreground text-lg">{currentUser.total_correct}</span>
              </div>

              <div className="hidden md:flex col-span-2 items-center justify-center">
                <span className="text-muted-foreground font-medium">{currentUser.total_quizzes} bài</span>
              </div>

              <div className="hidden md:flex col-span-2 items-center justify-center gap-1">
                <Award className={cn("w-4 h-4", currentUser.avg_accuracy >= 80 ? "text-primary" : "text-muted-foreground")} />
                <span className="font-semibold text-foreground">{currentUser.avg_accuracy}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
