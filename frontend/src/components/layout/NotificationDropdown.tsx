"use client";

import React, { useEffect, useState, useRef } from "react";
import { Bell, CheckCircle2, Sparkles, Megaphone, Info, X } from "lucide-react";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      if (data.success) {
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unread_count);
      }
    } catch (e) {
      console.error("Failed to load notifications", e);
    }
  };

  const markAsRead = async (id?: number) => {
    try {
      await api.post('/notifications/read', { notification_id: id });
      setUnreadCount(prev => id ? Math.max(0, prev - 1) : 0);
      setNotifications(prev => prev.map(n => 
        (id ? n.id === id : true) ? { ...n, is_read: true } : n
      ));
    } catch (e) {
      console.error(e);
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `${diff} giây trước`;
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'feature': return <Sparkles className="w-4 h-4 text-purple-500" />;
      case 'update': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'system': return <Megaphone className="w-4 h-4 text-rose-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && unreadCount > 0) markAsRead();
        }}
        aria-label="Thông báo hệ thống" 
        className={cn(
          "relative p-2 transition-colors rounded-xl",
          isOpen ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
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
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[85vh] flex flex-col bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 origin-top-right">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              Thông báo {unreadCount > 0 && <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">{unreadCount} mới</span>}
            </h3>
            {notifications.length > 0 && (
              <button 
                onClick={(e) => { e.stopPropagation(); markAsRead(); }}
                className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
              >
                Đánh dấu đã đọc
              </button>
            )}
          </div>

          <div className="overflow-y-auto overscroll-contain flex-1">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center flex flex-col items-center justify-center">
                <Bell className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Bạn chưa có thông báo nào</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={cn(
                      "flex items-start gap-3 p-4 border-b border-border/50 transition-colors hover:bg-muted/50 cursor-pointer",
                      !n.is_read ? "bg-primary/5" : ""
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-full shrink-0",
                      n.type === 'feature' ? "bg-purple-500/10" :
                      n.type === 'update' ? "bg-emerald-500/10" :
                      n.type === 'system' ? "bg-rose-500/10" : "bg-blue-500/10"
                    )}>
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className={cn("text-sm font-semibold leading-tight", !n.is_read ? "text-foreground" : "text-muted-foreground")}>
                        {n.title}
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground/80 font-medium pt-1">
                        {getTimeAgo(n.created_at)}
                      </p>
                    </div>
                    {!n.is_read && (
                      <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-2 border-t border-border bg-muted/20 text-center">
            <span className="text-[11px] text-muted-foreground font-medium">OpenQuiz Notification System</span>
          </div>
        </div>
      )}
    </div>
  );
}
