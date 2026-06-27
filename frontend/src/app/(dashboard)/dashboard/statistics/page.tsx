"use client";

import React, { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Target, Clock, Flame, Loader2, Trophy, BrainCircuit } from "lucide-react";
import api from "@/lib/axios";

export default function StatisticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/user/stats');
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Đang tải dữ liệu thống kê...</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
          <BrainCircuit className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Thống kê học tập</h1>
          <p className="text-muted-foreground text-sm">Phân tích hiệu suất và tiến độ của bạn theo thời gian</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Tổng bài đã thi</p>
            <h4 className="text-2xl font-bold text-foreground">{stats.total_quizzes}</h4>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Độ chính xác TB</p>
            <h4 className="text-2xl font-bold text-foreground">{stats.accuracy}%</h4>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Thời gian học</p>
            <h4 className="text-2xl font-bold text-foreground">{Math.round(stats.total_time_seconds / 60)} phút</h4>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Chuỗi ngày học</p>
            <h4 className="text-2xl font-bold text-foreground">{stats.streak_days} ngày</h4>
          </div>
        </div>
      </div>

      {/* Charts */}
      {stats.trend && stats.trend.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Accuracy Trend */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-foreground mb-6">Biến thiên độ chính xác (7 ngày)</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border opacity-50" vertical={false} />
                  <XAxis dataKey="date" stroke="currentColor" className="text-muted-foreground text-xs" tickLine={false} axisLine={false} />
                  <YAxis stroke="currentColor" className="text-muted-foreground text-xs" tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px', color: 'var(--foreground)' }}
                    itemStyle={{ color: '#10B981', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="accuracy" name="Độ chính xác (%)" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorAccuracy)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Time & Activity Bar Chart */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-foreground mb-6">Thời gian học tập (Phút)</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border opacity-50" vertical={false} />
                  <XAxis dataKey="date" stroke="currentColor" className="text-muted-foreground text-xs" tickLine={false} axisLine={false} />
                  <YAxis stroke="currentColor" className="text-muted-foreground text-xs" tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px', color: 'var(--foreground)' }}
                    cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                  <Bar dataKey="time_minutes" name="Thời gian (Phút)" fill="#4F7CFF" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="quizzes" name="Số bài đã làm" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Chưa có đủ dữ liệu thống kê</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Hệ thống cần bạn hoàn thành thêm một số bài thi để có thể vẽ biểu đồ phân tích. Hãy tiếp tục luyện tập nhé!
          </p>
        </div>
      )}
    </div>
  );
}
