"use client";

import React, { useEffect, useState } from "react";
import { Trophy, Medal, Target, Award, Loader2, Sparkles, Crown, Star, Zap } from "lucide-react";
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

// Podium card cho top 3
function PodiumCard({ user, delay = 0 }: { user: LeaderboardUser; delay?: number }) {
  const rank = user.rank as number;
  const isFirst = rank === 1;
  const isSecond = rank === 2;
  const isThird = rank === 3;

  const heights = { 1: "h-28", 2: "h-20", 3: "h-16" };
  const podiumH = heights[rank as 1 | 2 | 3] ?? "h-16";

  const avatarSizes = { 1: "w-20 h-20", 2: "w-16 h-16", 3: "w-14 h-14" };
  const avatarSize = avatarSizes[rank as 1 | 2 | 3] ?? "w-14 h-14";

  const orders = { 1: "order-2", 2: "order-1", 3: "order-3" };
  const order = orders[rank as 1 | 2 | 3] ?? "order-3";

  const rankClass = isFirst ? "rank-gold" : isSecond ? "rank-silver" : "rank-bronze";
  const podiumBg = isFirst
    ? "from-amber-500/25 via-amber-400/15 to-amber-500/5"
    : isSecond
    ? "from-slate-400/20 via-slate-300/10 to-slate-400/5"
    : "from-orange-500/20 via-orange-400/10 to-orange-500/5";

  const borderColor = isFirst
    ? "border-amber-400/40"
    : isSecond
    ? "border-slate-400/30"
    : "border-orange-400/30";

  const RankIcon = isFirst ? Crown : Medal;
  const iconColor = isFirst
    ? "text-amber-500 dark:text-amber-400"
    : isSecond
    ? "text-slate-500 dark:text-slate-300"
    : "text-orange-500 dark:text-orange-400";

  return (
    <div
      className={cn("flex flex-col items-center gap-2 flex-1", order, "animate-slide-up")}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Avatar + crown */}
      <div className="relative">
        {isFirst && (
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10">
            <Crown className="w-6 h-6 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-bounce-subtle" />
          </div>
        )}
        <div
          className={cn(
            "rounded-full overflow-hidden border-2 shadow-lg ring-2 ring-offset-2 ring-offset-card",
            avatarSize,
            isFirst
              ? "ring-amber-400/60 border-amber-400/50"
              : isSecond
              ? "ring-slate-400/40 border-slate-400/40"
              : "ring-orange-400/40 border-orange-400/40"
          )}
        >
          <img
            src={
              user.avatar ||
              `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(user.name)}`
            }
            alt={user.name}
            className="w-full h-full object-cover"
          />
        </div>
        {/* Rank badge */}
        <div
          className={cn(
            "absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border shadow-sm text-xs font-black",
            rankClass
          )}
        >
          {rank}
        </div>
      </div>

      {/* Name */}
      <div className="text-center px-1">
        <p className={cn("font-bold text-sm truncate max-w-[100px]", isFirst && "gradient-text-gold")}>
          {user.name}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {user.total_correct} câu đúng
        </p>
      </div>

      {/* Podium base */}
      <div
        className={cn(
          "w-full rounded-t-xl bg-gradient-to-t border-t border-x flex items-center justify-center gap-1",
          podiumH,
          podiumBg,
          borderColor
        )}
      >
        <RankIcon className={cn("w-5 h-5", iconColor)} />
        <span className={cn("text-lg font-black", iconColor)}>#{rank}</span>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [currentUser, setCurrentUser] = useState<LeaderboardUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem("openquiz_cached_leaderboard");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.leaderboard) {
          setLeaderboard(parsed.leaderboard);
          if (parsed.currentUser) setCurrentUser(parsed.currentUser);
          setLoading(false);
        }
      }
    } catch {}

    const fetchLeaderboard = async () => {
      try {
        const { data } = await api.get("/leaderboard");
        if (data.success) {
          setLeaderboard(data.data.leaderboard);
          setCurrentUser(data.data.current_user);
          try {
            sessionStorage.setItem(
              "openquiz_cached_leaderboard",
              JSON.stringify({
                leaderboard: data.data.leaderboard,
                currentUser: data.data.current_user,
              })
            );
          } catch {}
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
    if (rank === 1) return "rank-gold";
    if (rank === 2) return "rank-silver";
    if (rank === 3) return "rank-bronze";
    return "bg-muted text-muted-foreground border-border";
  };

  const getRankIcon = (rank: number | string) => {
    if (rank === 1) return <Crown className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />;
    if (rank === 2) return <Medal className="w-3.5 h-3.5 text-slate-500 dark:text-slate-300" />;
    if (rank === 3) return <Medal className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />;
    return <span className="font-bold text-xs">{rank}</span>;
  };

  const top3 = leaderboard.filter((u) => Number(u.rank) <= 3);
  const rest = leaderboard.filter((u) => Number(u.rank) > 3);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <Trophy className="w-8 h-8 text-amber-500 animate-bounce-subtle" />
          </div>
        </div>
        <div className="space-y-1 text-center">
          <p className="font-semibold text-foreground">Đang tải bảng xếp hạng...</p>
          <p className="text-sm text-muted-foreground">Chuẩn bị vinh danh những ngôi sao</p>
        </div>
        {/* Skeleton rows */}
        <div className="w-full max-w-2xl space-y-2 mt-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-xl" style={{ opacity: 1 - i * 0.15 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="animate-slide-up">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-primary/10 border border-amber-500/20 p-6">
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
                  Bảng Xếp Hạng
                  <Sparkles className="w-5 h-5 text-amber-500 animate-pulse-slow" />
                </h1>
                <p className="text-muted-foreground text-sm mt-0.5">
                  Vinh danh những người có thành tích học tập xuất sắc nhất
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                Top {leaderboard.length} người
              </span>
            </div>
          </div>
          {/* Decorative orbs */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-20 w-20 h-20 bg-orange-400/10 rounded-full blur-2xl" />
        </div>
      </div>

      {leaderboard.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
            <Trophy className="w-10 h-10 text-muted-foreground/30" />
          </div>
          <div>
            <p className="font-bold text-foreground">Chưa có ai tham gia</p>
            <p className="text-sm text-muted-foreground mt-1">
              Hãy là người đầu tiên hoàn thành đề thi để ghi tên lên bảng vinh danh!
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Podium - Top 3 */}
          {top3.length >= 2 && (
            <div
              className="animate-slide-up bg-card border border-border rounded-2xl p-6 shadow-sm"
              style={{ animationDelay: "100ms" }}
            >
              <div className="flex items-end justify-center gap-3 sm:gap-6">
                {[...top3]
                  .sort((a, b) => Number(a.rank) - Number(b.rank))
                  .map((user, i) => (
                    <PodiumCard
                      key={user.id}
                      user={user}
                      delay={i * 80}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Table for rank 4+ */}
          {rest.length > 0 && (
            <div
              className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm animate-slide-up"
              style={{ animationDelay: "200ms" }}
            >
              {/* Table header */}
              <div className="grid grid-cols-12 gap-2 sm:gap-4 px-4 py-3 border-b border-border bg-secondary/60 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <div className="col-span-2 md:col-span-1 text-center">Hạng</div>
                <div className="col-span-6 md:col-span-4 pl-1">Người dùng</div>
                <div className="col-span-4 md:col-span-3 text-center">Câu đúng</div>
                <div className="hidden md:block col-span-2 text-center">Số bài</div>
                <div className="hidden md:block col-span-2 text-center">Chính xác</div>
              </div>

              <div className="divide-y divide-border stagger-children">
                {rest.map((user, idx) => (
                  <div
                    key={user.id}
                    className={cn(
                      "grid grid-cols-12 gap-2 sm:gap-4 px-4 py-3 items-center transition-all hover:bg-muted/40 animate-slide-up",
                      currentUser?.id === user.id
                        ? "bg-primary/5 border-l-2 border-l-primary"
                        : ""
                    )}
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    <div className="col-span-2 md:col-span-1 flex justify-center">
                      <div
                        className={cn(
                          "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border text-xs font-bold",
                          getRankStyle(user.rank)
                        )}
                      >
                        {getRankIcon(user.rank)}
                      </div>
                    </div>

                    <div className="col-span-6 md:col-span-4 flex items-center gap-2 sm:gap-3 pl-1 truncate">
                      <img
                        src={
                          user.avatar ||
                          `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(user.name)}`
                        }
                        alt={user.name}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover shrink-0 border border-border/80 bg-muted"
                      />
                      <span
                        className={cn(
                          "text-xs sm:text-sm font-medium truncate",
                          currentUser?.id === user.id ? "text-primary font-bold" : "text-foreground"
                        )}
                      >
                        {user.name}
                        {currentUser?.id === user.id && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/20">
                            Bạn
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="col-span-4 md:col-span-3 flex items-center justify-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="font-bold text-foreground text-sm sm:text-base">
                        {user.total_correct}
                      </span>
                    </div>

                    <div className="hidden md:flex col-span-2 items-center justify-center">
                      <span className="text-muted-foreground text-xs sm:text-sm font-medium">
                        {user.total_quizzes} bài
                      </span>
                    </div>

                    <div className="hidden md:flex col-span-2 items-center justify-center gap-1">
                      <Star
                        className={cn(
                          "w-3.5 h-3.5",
                          user.avg_accuracy >= 80 ? "text-primary fill-primary/30" : "text-muted-foreground"
                        )}
                      />
                      <span className="font-semibold text-foreground text-xs sm:text-sm">
                        {user.avg_accuracy}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Current user sticky bar */}
      {currentUser && Number(currentUser.rank) > 3 && (
        <div className="sticky bottom-16 md:bottom-4 z-20 animate-slide-up" style={{ animationDelay: "300ms" }}>
          <div className="glass-card rounded-2xl border-primary/20 px-4 py-3 shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center border text-xs font-bold shrink-0",
                    getRankStyle(currentUser.rank)
                  )}
                >
                  {currentUser.rank !== "-" ? `#${currentUser.rank}` : "-"}
                </div>
                <img
                  src={currentUser.avatar || "/images/avatar-student.jpg"}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full border border-primary/40 object-cover shrink-0"
                />
                <div>
                  <p className="text-sm font-bold text-foreground">{currentUser.name}</p>
                  <p className="text-xs text-muted-foreground">Thành tích của bạn</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="text-center hidden sm:block">
                  <p className="font-bold text-foreground">{currentUser.total_correct}</p>
                  <p className="text-muted-foreground">Câu đúng</p>
                </div>
                <div className="text-center hidden sm:block">
                  <p className="font-bold text-foreground">{currentUser.avg_accuracy}%</p>
                  <p className="text-muted-foreground">Chính xác</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-primary">#{currentUser.rank}</p>
                  <p className="text-muted-foreground">Hạng</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
