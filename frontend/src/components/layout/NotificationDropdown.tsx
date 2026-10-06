"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { Bell, CheckCircle2, Sparkles, Megaphone, Info, Zap, Calendar, Bookmark, PlusCircle, Check } from "lucide-react";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

export interface NotificationItem {
  id: number | string;
  type: "feature" | "update" | "system" | string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  link?: string;
}

// Danh sách thông báo mặc định về các tính năng mới nhất của hệ thống OpenQuiz
const SYSTEM_FEATURE_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "feat-ai",
    type: "feature",
    title: "🚀 Trợ lý AI Gemini thông minh",
    message: "Tích hợp trực tiếp khi làm bài thi: bấm 'Hỏi AI' để được giải thích chi tiết, phản biện đáp án và gợi ý mẹo nhớ siêu tốc!",
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    link: "/dashboard/quizzes"
  },
  {
    id: "feat-auto-next",
    type: "update",
    title: "⚡ Tùy chỉnh tốc độ nhảy câu (Auto-Next)",
    message: "Chọn đáp án là tự động chuyển câu! Bạn có thể chọn tốc độ tức thì (0s), 0.5s, 1s, 2s... hoặc tắt theo ý muốn kèm âm thanh hiệu ứng sống động.",
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    link: "/dashboard/quizzes"
  },
  {
    id: "feat-schedule",
    type: "system",
    title: "📅 Tự động đồng bộ Lịch thi ITC HUBT",
    message: "Tra cứu phòng thi, ca thi, đếm ngược ngày thi và hệ thống tự động ưu tiên đề thi của các môn thi diễn ra hôm nay.",
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    link: "/dashboard/schedule"
  },
  {
    id: "feat-bookmarks",
    type: "feature",
    title: "📌 Sổ tay lưu câu hỏi khó (Bookmarks)",
    message: "Lưu lại bất kỳ câu hỏi nào cần lưu ý bằng cách bấm icon Bookmark để mở sổ tay ôn luyện riêng biệt bất cứ lúc nào.",
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    link: "/dashboard/bookmarks"
  },
  {
    id: "feat-itest",
    type: "update",
    title: "🖥️ Chế độ thi iTest Chuẩn Phòng Máy HUBT",
    message: "Mô phỏng 100% giao diện phần mềm thi tin học của trường: thẻ sinh viên, lưới câu hỏi và thanh điều hướng thực tế.",
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    link: "/dashboard/quizzes"
  }
];

const STORAGE_KEY = "openquiz_read_notifications";

export function NotificationDropdown() {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isOwnerOrAdmin = useMemo(() => {
    return (
      user?.role === "admin" ||
      user?.email === "hoangdeptraivodich12@gmail.com" ||
      user?.email?.startsWith("admin@") ||
      user?.name?.toLowerCase() === "hoang"
    );
  }, [user]);

  // Đọc danh sách ID đã đọc từ localStorage
  const getReadIds = (): string[] => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  const saveReadIds = (ids: (string | number)[]) => {
    if (typeof window === "undefined") return;
    try {
      const current = getReadIds();
      const next = Array.from(new Set([...current, ...ids.map(String)]));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error(e);
    }
  };

  const fetchNotifications = async () => {
    const readIds = new Set(getReadIds());

    // Khởi tạo trước với các thông báo hệ thống
    const baseList: NotificationItem[] = SYSTEM_FEATURE_NOTIFICATIONS.map((item) => ({
      ...item,
      is_read: readIds.has(String(item.id))
    }));

    try {
      const { data } = await api.get("/notifications");
      if (data?.success && Array.isArray(data.data?.notifications)) {
        const backendItems: NotificationItem[] = data.data.notifications.map((n: any) => ({
          ...n,
          is_read: n.is_read || readIds.has(String(n.id))
        }));

        // Gộp thông báo từ server (ưu tiên hiển thị trên đầu) và thông báo hệ thống
        const merged = [...backendItems, ...baseList];
        setNotifications(merged);
        return;
      }
    } catch (e) {
      // Backend có thể offline hoặc chưa có bản ghi, vẫn hiển thị thông báo hệ thống mượt mà
    }

    setNotifications(baseList);
  };

  useEffect(() => {
    fetchNotifications();

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.is_read).length;
  }, [notifications]);

  const markAsRead = async (id?: string | number) => {
    if (id !== undefined) {
      saveReadIds([id]);
      setNotifications((prev) =>
        prev.map((n) => (String(n.id) === String(id) ? { ...n, is_read: true } : n))
      );
      if (typeof id === "number") {
        try {
          await api.post("/notifications/read", { notification_id: id });
        } catch {
          // ignore
        }
      }
    } else {
      // Đánh dấu tất cả đã đọc
      const allIds = notifications.map((n) => n.id);
      saveReadIds(allIds);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      try {
        await api.post("/notifications/read", {});
      } catch {
        // ignore
      }
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (isNaN(diff) || diff < 60) return "Vừa xong";
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "feature":
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      case "update":
        return <Zap className="w-4 h-4 text-amber-400" />;
      case "system":
        return <Calendar className="w-4 h-4 text-emerald-400" />;
      default:
        return <Megaphone className="w-4 h-4 text-blue-400" />;
    }
  };

  const displayedList = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((n) => !n.is_read);
    }
    return notifications;
  }, [notifications, filter]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
        }}
        aria-label="Thông báo hệ thống"
        className={cn(
          "relative p-2 transition-colors rounded-xl",
          isOpen
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
        )}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-rose-500 ring-2 ring-background">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-84 sm:w-96 max-h-[85vh] flex flex-col bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 origin-top-right">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                Thông báo
                {unreadCount > 0 && (
                  <span className="bg-primary/15 text-primary text-[11px] font-bold px-2 py-0.5 rounded-full border border-primary/20">
                    {unreadCount} mới
                  </span>
                )}
              </h3>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAsRead()}
                    className="text-[11px] text-muted-foreground hover:text-primary transition-colors font-medium flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    Đã đọc hết
                  </button>
                )}
                {isOwnerOrAdmin && (
                  <Link
                    href="/dashboard/admin/notifications"
                    onClick={() => setIsOpen(false)}
                    className="text-[11px] bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 transition-colors"
                  >
                    <PlusCircle className="w-3 h-3" />
                    Phát tin
                  </Link>
                )}
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/40 text-xs">
              <button
                onClick={() => setFilter("all")}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-medium transition-all text-xs",
                  filter === "all"
                    ? "bg-secondary text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Tất cả ({notifications.length})
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-medium transition-all text-xs",
                  filter === "unread"
                    ? "bg-secondary text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Chưa đọc ({unreadCount})
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto overscroll-contain flex-1 divide-y divide-border/40">
            {displayedList.length === 0 ? (
              <div className="px-4 py-12 text-center flex flex-col items-center justify-center">
                <Bell className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-foreground">Không có thông báo nào</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {filter === "unread" ? "Bạn đã đọc hết mọi thông báo mới!" : "Chưa có thông báo nào được tạo."}
                </p>
              </div>
            ) : (
              displayedList.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className={cn(
                    "flex items-start gap-3 p-3.5 transition-colors hover:bg-muted/50 cursor-pointer relative group",
                    !n.is_read ? "bg-primary/5 dark:bg-primary/10" : ""
                  )}
                >
                  <div
                    className={cn(
                      "p-2 rounded-xl shrink-0 border border-border/40 shadow-xs",
                      n.type === "feature"
                        ? "bg-purple-500/10 text-purple-400"
                        : n.type === "update"
                        ? "bg-amber-500/10 text-amber-400"
                        : n.type === "system"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-blue-500/10 text-blue-400"
                    )}
                  >
                    {getIcon(n.type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4
                        className={cn(
                          "text-xs sm:text-sm font-bold leading-snug line-clamp-2",
                          !n.is_read ? "text-foreground font-black" : "text-muted-foreground"
                        )}
                      >
                        {n.title}
                      </h4>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0 ring-2 ring-primary/20" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                      {n.message}
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-muted-foreground/75 font-medium">
                        {getTimeAgo(n.created_at)}
                      </span>
                      {n.link && (
                        <Link
                          href={n.link}
                          onClick={() => setIsOpen(false)}
                          className="text-[10px] font-bold text-primary hover:underline"
                        >
                          Xem chi tiết &rarr;
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-border bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground px-4">
            <span>OpenQuiz Notification</span>
            {isOwnerOrAdmin ? (
              <Link
                href="/dashboard/admin/notifications"
                onClick={() => setIsOpen(false)}
                className="font-bold text-primary hover:underline flex items-center gap-1"
              >
                Trang quản trị &rarr;
              </Link>
            ) : (
              <span className="text-emerald-500 font-semibold">Tự động cập nhật 24/7</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
