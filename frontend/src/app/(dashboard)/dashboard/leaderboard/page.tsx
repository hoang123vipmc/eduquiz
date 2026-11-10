"use client";

import React, { useEffect, useState } from "react";
import { Trophy, Medal, Target, Crown, Star, Users } from "lucide-react";
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

  const top3 = leaderboard.filter((u) => Number(u.rank) <= 3);

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="h-20 rounded-xl bg-card border border-border animate-pulse p-5" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-card border border-border animate-pulse" />
          ))}
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Bảng xếp hạng học viên
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Xếp hạng dựa trên tổng số câu trả lời đúng và độ chính xác trung bình
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary border border-border self-start sm:self-auto">
          <Users className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-mono font-semibold text-foreground tabular-nums">
            Top {leaderboard.length} học viên
          </span>
        </div>
      </div>

      {leaderboard.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center rounded-xl border border-dashed border-border bg-card">
          <div className="w-12 h-12 rounded-lg bg-secondary border border-border flex items-center justify-center">
            <Trophy className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">Chưa có dữ liệu xếp hạng</p>
            <p className="text-xs text-muted-foreground mt-1">
              Hoàn thành bài thi đầu tiên để ghi danh lên bảng thành tích.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Top 3 Cards */}
          {top3.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...top3]
                .sort((a, b) => Number(a.rank) - Number(b.rank))
                .map((user) => {
                  const rank = Number(user.rank);
                  const isFirst = rank === 1;
                  const isSecond = rank === 2;
                  return (
                    <div
                      key={user.id}
                      className={cn(
                        "p-5 rounded-xl border bg-card flex flex-col justify-between gap-4 transition-colors",
                        isFirst
                          ? "border-amber-500/40 bg-amber-500/[0.02]"
                          : "border-border"
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={
                              user.avatar ||
                              `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(user.name)}`
                            }
                            alt={user.name}
                            className="w-11 h-11 rounded-full object-cover border border-border shrink-0 bg-secondary"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-foreground truncate">
                              {user.name}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono tabular-nums mt-0.5">
                              {user.total_quizzes} đề đã hoàn thành
                            </p>
                          </div>
                        </div>

                        <span
                          className={cn(
                            "px-2 py-1 rounded-md text-xs font-mono font-bold border shrink-0 flex items-center gap-1 tabular-nums",
                            isFirst
                              ? "rank-gold"
                              : isSecond
                              ? "rank-silver"
                              : "rank-bronze"
                          )}
                        >
                          {isFirst ? <Crown className="w-3.5 h-3.5" /> : <Medal className="w-3.5 h-3.5" />}
                          <span>#{rank}</span>
                        </span>
                      </div>

                      <div className="pt-3 border-t border-border grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Tổng câu đúng</span>
                          <span className="font-mono font-bold text-sm text-foreground tabular-nums">
                            {user.total_correct}
                          </span>
                        </div>
                        <div className="border-l border-border pl-3">
                          <span className="text-muted-foreground block text-[11px]">Độ chính xác</span>
                          <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400 tabular-nums">
                            {user.avg_accuracy}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Full Ranking Ledger */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xs">
            <div className="grid grid-cols-12 gap-2 sm:gap-4 px-4 py-3 border-b border-border bg-secondary/50 text-[11px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="col-span-2 md:col-span-1 text-center">Hạng</div>
              <div className="col-span-6 md:col-span-5 pl-1">Học viên</div>
              <div className="col-span-4 md:col-span-2 text-right md:text-center">Câu đúng</div>
              <div className="hidden md:block col-span-2 text-center">Số đề</div>
              <div className="hidden md:block col-span-2 text-right pr-2">Chính xác</div>
            </div>

            <div className="divide-y divide-border">
              {leaderboard.map((user) => {
                const isMe = currentUser?.id === user.id;
                const rank = Number(user.rank);
                return (
                  <div
                    key={user.id}
                    className={cn(
                      "grid grid-cols-12 gap-2 sm:gap-4 px-4 py-3 items-center transition-colors hover:bg-secondary/40",
                      isMe ? "bg-primary/[0.04]" : ""
                    )}
                  >
                    <div className="col-span-2 md:col-span-1 flex justify-center">
                      <span
                        className={cn(
                          "w-7 h-7 rounded-md flex items-center justify-center border text-xs font-mono font-semibold tabular-nums",
                          rank === 1
                            ? "rank-gold"
                            : rank === 2
                            ? "rank-silver"
                            : rank === 3
                            ? "rank-bronze"
                            : "bg-secondary text-muted-foreground border-border"
                        )}
                      >
                        {user.rank}
                      </span>
                    </div>

                    <div className="col-span-6 md:col-span-5 flex items-center gap-2.5 pl-1 min-w-0">
                      <img
                        src={
                          user.avatar ||
                          `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(user.name)}`
                        }
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover shrink-0 border border-border bg-secondary"
                      />
                      <span
                        className={cn(
                          "text-xs sm:text-sm font-medium truncate",
                          isMe ? "text-primary font-semibold" : "text-foreground"
                        )}
                      >
                        {user.name}
                      </span>
                      {isMe && (
                        <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-mono font-semibold border border-primary/20 shrink-0">
                          Bạn
                        </span>
                      )}
                    </div>

                    <div className="col-span-4 md:col-span-2 flex items-center justify-end md:justify-center gap-1.5 font-mono tabular-nums">
                      <Target className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="font-semibold text-foreground text-xs sm:text-sm">
                        {user.total_correct}
                      </span>
                    </div>

                    <div className="hidden md:flex col-span-2 items-center justify-center font-mono tabular-nums">
                      <span className="text-muted-foreground text-xs">
                        {user.total_quizzes} đề
                      </span>
                    </div>

                    <div className="hidden md:flex col-span-2 items-center justify-end pr-2 gap-1 font-mono tabular-nums">
                      <Star
                        className={cn(
                          "w-3.5 h-3.5",
                          user.avg_accuracy >= 80 ? "text-primary fill-primary/20" : "text-muted-foreground"
                        )}
                      />
                      <span className="font-semibold text-foreground text-xs sm:text-sm">
                        {user.avg_accuracy}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Current user summary bar */}
      {currentUser && Number(currentUser.rank) > 3 && (
        <div className="sticky bottom-16 md:bottom-4 z-20">
          <div className="bg-card rounded-xl border border-border px-4 py-3 shadow-lg flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-7 h-7 rounded-md bg-primary/10 text-primary border border-primary/20 flex items-center justify-center text-xs font-mono font-bold tabular-nums shrink-0">
                #{currentUser.rank}
              </div>
              <img
                src={currentUser.avatar || "/images/avatar-student.jpg"}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full border border-border object-cover shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-foreground truncate">{currentUser.name}</p>
                <p className="text-[11px] text-muted-foreground">Vị trí hiện tại của bạn</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono tabular-nums shrink-0">
              <div className="text-right hidden sm:block">
                <p className="font-bold text-foreground">{currentUser.total_correct}</p>
                <p className="text-[10px] font-sans text-muted-foreground">Câu đúng</p>
              </div>
              <div className="text-right hidden sm:block">
                <p className="font-bold text-emerald-600 dark:text-emerald-400">{currentUser.avg_accuracy}%</p>
                <p className="text-[10px] font-sans text-muted-foreground">Chính xác</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
