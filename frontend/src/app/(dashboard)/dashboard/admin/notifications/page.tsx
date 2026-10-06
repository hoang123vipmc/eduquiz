"use client";

import React, { useState, useEffect } from "react";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import { Loader2, Megaphone, CheckCircle2, AlertCircle, Trash2, Send } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminNotificationsPage() {
  const { user: authUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  
  const [form, setForm] = useState({
    title: "",
    message: "",
    type: "feature" // feature, update, system
  });
  
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (authUser?.role === "admin") {
      fetchHistory();
    }
  }, [authUser?.role]);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchHistory = async () => {
    try {
      const { data } = await api.get('/admin/notifications');
      if (data.success) {
        setHistory(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      showToast("error", "Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    
    setLoading(true);
    try {
      const { data } = await api.post('/admin/notifications', form);
      if (data.success) {
        showToast("success", data.message);
        setForm({ title: "", message: "", type: "feature" });
        fetchHistory();
      }
    } catch (e: any) {
      showToast("error", e.response?.data?.message || "Có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  };

  if (!authUser) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  
  if (authUser.role !== "admin") return null;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      {toast && (
        <div className={cn(
          "fixed top-5 right-5 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold shadow-lg border animate-in slide-in-from-right-4",
          toast.type === "success"
            ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
            : "bg-rose-500/10 text-rose-700 border-rose-500/20"
        )}>
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.text}
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
          <Megaphone className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Phát thông báo hệ thống</h1>
          <p className="text-sm text-muted-foreground">Tạo thông báo về tính năng mới, cập nhật cho toàn bộ người dùng.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm h-fit">
          <h2 className="text-lg font-bold mb-4">Tạo thông báo mới</h2>
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Loại thông báo</label>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="feature">Tính năng mới</option>
                <option value="update">Cập nhật nội dung</option>
                <option value="system">Bảo trì / Hệ thống</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1.5">Tiêu đề</label>
              <input
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="VD: Tính năng thi thử iTest..."
                className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Nội dung chi tiết</label>
              <textarea
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                placeholder="Nội dung thông báo tới người dùng..."
                rows={4}
                className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 rounded-xl transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Phát thông báo cho TẤT CẢ
            </button>
          </form>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4">Lịch sử đã phát</h2>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">Chưa có thông báo nào.</p>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {history.map((n, i) => (
                <div key={i} className="p-4 rounded-xl border border-border bg-muted/20">
                  <div className="flex gap-2 items-start mb-2">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                      n.type === 'feature' ? "bg-purple-500/10 text-purple-600" :
                      n.type === 'update' ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                    )}>
                      {n.type}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(n.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm">{n.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
