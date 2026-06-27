"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import { History, CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import { formatQuizDuration } from "@/lib/utils/time";
import { cn } from "@/lib/utils";

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await api.get("/user/history");
        if (data.success) {
          setHistory(data.data);
        }
      } catch (error) {
        console.error("Lỗi tải lịch sử", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit' 
    }).format(d);
  };

  const getScoreColor = (score: number) => {
    if (score === 100) return "text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20";
    if (score >= 80) return "text-[#4F7CFF] bg-[#4F7CFF]/10 border-[#4F7CFF]/20";
    if (score >= 60) return "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20";
    return "text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/20";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header Area */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4F7CFF] to-indigo-600 flex items-center justify-center text-foreground shadow-lg shadow-blue-500/20">
          <History className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-1">Lịch sử làm bài</h2>
          <p className="text-muted-foreground text-[15px]">
            Xem lại kết quả các bài thi bạn đã nộp và theo dõi tiến trình.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-[60px] bg-muted rounded-xl animate-pulse border border-border"></div>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-[72px] bg-card rounded-xl animate-pulse border border-border"></div>
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-card rounded-[20px] border border-border shadow-2xl">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
            <History className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-3">Chưa có lịch sử</h3>
          <p className="text-muted-foreground max-w-sm mb-8">
            Bạn chưa hoàn thành bài thi nào. Hãy bắt đầu làm bài để xem lịch sử và đánh giá hiệu suất tại đây.
          </p>
          <button 
            onClick={() => router.push('/dashboard/quizzes')}
            className="flex items-center gap-2 bg-[#4F7CFF] hover:bg-[#6D91FF] text-foreground px-6 py-3 rounded-xl font-semibold shadow-[0_4px_12px_rgba(79,124,255,0.3)] transition-all hover:shadow-[0_6px_16px_rgba(79,124,255,0.4)] hover:-translate-y-0.5"
          >
            Khám phá đề thi
          </button>
        </div>
      ) : (
        <div className="bg-card rounded-[20px] border border-border shadow-[0_8px_30px_rgba(0,0,0,0.4)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[15px] text-left border-collapse">
              <thead className="bg-secondary text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="px-6 py-5">Tên đề thi</th>
                  <th className="px-6 py-5">Thời gian nộp</th>
                  <th className="px-6 py-5">Điểm số</th>
                  <th className="px-6 py-5">Số câu đúng</th>
                  <th className="px-6 py-5">Thời gian làm</th>
                  <th className="px-6 py-5 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history.map((h) => {
                  const scoreColor = getScoreColor(h.score);
                  const isPass = h.score >= 50;
                  return (
                    <tr key={h.id} className="hover:bg-muted transition-colors group">
                      <td className="px-6 py-5">
                        <div className="font-semibold text-foreground max-w-[250px] truncate group-hover:text-foreground transition-colors" title={h.quiz?.title}>
                          {h.quiz?.title || "Đề thi đã bị xóa"}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-muted-foreground">
                        {formatDate(h.created_at)}
                      </td>
                      <td className="px-6 py-5">
                        <span className={cn("px-3 py-1 rounded-lg border font-bold text-sm", scoreColor)}>
                          {h.score} pts
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          {isPass ? (
                            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                          ) : (
                            <XCircle className="w-4 h-4 text-[#EF4444]" />
                          )}
                          <span className="text-foreground font-medium">
                            {h.correct_answers} <span className="text-muted-foreground text-xs">/ {h.quiz?.total_questions || '-'}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 font-medium text-foreground">
                        {formatQuizDuration(h.time_taken_seconds * 1000, 'text')}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button 
                          onClick={() => router.push(`/result/${h.attempt_id || h.id}`)}
                          className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-foreground font-medium transition-colors"
                        >
                          Chi tiết <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
