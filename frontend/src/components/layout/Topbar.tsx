"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Bell, Search } from "lucide-react";

interface TopbarProps {
  onOpenMobile?: () => void;
}

export function Topbar({ onOpenMobile }: TopbarProps) {
  const { user } = useAuthStore();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/dashboard/quizzes?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      router.push('/dashboard/quizzes');
    }
  };

  return (
    <header className="h-16 sm:h-[70px] bg-background/70 backdrop-blur-xl sticky top-0 z-30 px-3 sm:px-6 flex items-center justify-between border-b border-border/60 shadow-sm">
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
        <form onSubmit={handleSearch} className="relative hidden sm:block max-w-md w-full">
          <Search className="w-[16px] h-[16px] absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm đề thi..." 
            aria-label="Tìm kiếm đề thi"
            className="h-9 w-full rounded-full border border-border bg-secondary pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </form>
        {/* Mobile brand */}
        <div 
          onClick={() => router.push('/dashboard')}
          className="sm:hidden flex items-center gap-2.5 font-bold text-foreground cursor-pointer active:scale-95 transition-transform"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary via-violet-500 to-purple-600 text-white flex items-center justify-center text-xs font-black shadow-sm">
            OQ
          </div>
          <span className="text-base tracking-tight font-black gradient-text">OpenQuiz</span>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
        <button 
          onClick={() => router.push('/dashboard/quizzes')}
          aria-label="Tìm kiếm đề thi"
          className="sm:hidden p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-secondary transition-colors"
        >
          <Search className="w-5 h-5" />
        </button>

        <button 
          aria-label="Thông báo hệ thống" 
          className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-secondary"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border-2 border-background" />
        </button>

        <div className="h-5 sm:h-6 w-px bg-border" />

        <div 
          onClick={() => router.push('/dashboard/settings')}
          className="flex items-center gap-2.5 cursor-pointer group"
          title="Tài khoản cá nhân"
        >
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{user?.name || "Học viên"}</span>
            <span className="text-[11px] text-muted-foreground capitalize">{user?.role === 'admin' ? 'Quản trị viên' : 'Học viên'}</span>
          </div>
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-primary/20 group-hover:border-primary/50 transition-colors shadow-sm shrink-0">
            <img 
              src={user?.avatar || "/images/avatar-student.jpg"} 
              alt={user?.name || "Avatar"} 
              className="w-full h-full object-cover" 
            />
          </div>
        </div>
      </div>
    </header>
  );
}
