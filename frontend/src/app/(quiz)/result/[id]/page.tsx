"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, AlertCircle, Home, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function QuizResultPage() {
  const { id } = useParams();
  const router = useRouter();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const { data } = await api.get(`/results/${id}`);
        if (data.success) {
          setResult(data.data);
        }
      } catch (error) {
        console.error("Lỗi lấy kết quả", error);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [id]);

  if (loading || !result) {
    return <div className="min-h-screen flex items-center justify-center">Đang phân tích kết quả...</div>;
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m} phút ${s} giây`;
  };

  const isPass = result.score >= 50;

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Điểm số tổng quan */}
        <Card className="text-center overflow-hidden border-0 shadow-lg">
          <div className={cn("h-32", isPass ? "bg-emerald-500" : "bg-destructive")}></div>
          <CardContent className="pt-0 relative px-6 pb-10">
            <div className="w-32 h-32 rounded-full border-8 border-card bg-card mx-auto -mt-16 flex items-center justify-center shadow-sm relative z-10">
              {isPass ? (
                <CheckCircle2 className="w-16 h-16 text-emerald-500" />
              ) : (
                <XCircle className="w-16 h-16 text-destructive" />
              )}
            </div>
            <h1 className="text-3xl font-bold mt-4">
              {isPass ? "Chúc mừng bạn đã hoàn thành!" : "Rất tiếc, bạn chưa vượt qua!"}
            </h1>
            <p className="text-muted-foreground mt-2">
              Bạn đã nộp bài thi thành công. Dưới đây là kết quả chi tiết.
            </p>
            
            <div className="mt-8">
              <span className="text-6xl font-extrabold" style={{ color: isPass ? 'var(--color-quiz-correct)' : 'var(--color-quiz-wrong)'}}>
                {result.score}
              </span>
              <span className="text-2xl text-muted-foreground">/100</span>
            </div>
          </CardContent>
        </Card>

        {/* Thống kê chi tiết */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-sm text-muted-foreground font-medium">Đúng</p>
              <p className="text-2xl font-bold">{result.correct_answers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center space-y-2">
              <XCircle className="w-8 h-8 text-destructive mx-auto" />
              <p className="text-sm text-muted-foreground font-medium">Sai</p>
              <p className="text-2xl font-bold">{result.wrong_answers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
              <p className="text-sm text-muted-foreground font-medium">Bỏ qua</p>
              <p className="text-2xl font-bold">{result.skipped_answers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center space-y-2">
              <Clock className="w-8 h-8 text-blue-500 mx-auto" />
              <p className="text-sm text-muted-foreground font-medium">Thời gian</p>
              <p className="text-xl font-bold">{formatTime(result.time_taken_seconds)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center mt-8">
          <Button variant="outline" size="lg" className="w-full sm:w-auto" onClick={() => router.push('/dashboard')}>
            <Home className="w-5 h-5 mr-2" /> Về trang chủ
          </Button>
          <Button size="lg" className="w-full sm:w-auto" onClick={() => router.push(`/play/${result.attempt?.quiz_id || id}`)}>
            <RefreshCcw className="w-5 h-5 mr-2" /> Thi lại từ đầu
          </Button>
          {result.wrong_answers > 0 && (
            <Button size="lg" variant="secondary" className="w-full sm:w-auto bg-amber-500/10 text-amber-600 hover:bg-amber-500/20" 
              onClick={() => router.push(`/play/${result.attempt?.quiz_id}?retry_attempt=${result.attempt_id}`)}>
              <AlertCircle className="w-5 h-5 mr-2" /> Làm lại câu sai
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}
