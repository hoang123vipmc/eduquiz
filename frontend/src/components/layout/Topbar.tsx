"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useTheme } from "next-themes";
import { Search, X, Menu, Sun, Moon } from "lucide-react";
import { NotificationDropdown } from "./NotificationDropdown";

interface TopbarProps {
  onOpenMobile?: () => void;
}

export function Topbar({ onOpenMobile }: TopbarProps) {
  const { user } = useAuthStore();
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/dashboard/quizzes?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      router.push('/dashboard/quizzes');
    }
  };

  return (
    <header className="h-14 bg-background/95 backdrop-blur-xs border-b border-border sticky top-0 z-30 px-3 sm:px-6 flex items-center justify-between gap-3 sm:gap-6 shrink-0">
      {/* Mobile Hamburger & Brand */}
      <div className="flex items-center gap-2 sm:hidden shrink-0">
        <button
          onClick={onOpenMobile}
          aria-label="Mở menu"
          className="p-1.5 -ml-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div 
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 font-semibold text-foreground cursor-pointer"
        >
          <div className="w-6 h-6 rounded-md bg-foreground text-background flex items-center justify-center text-[11px] font-mono font-bold">
            OQ
          </div>
          <span className="text-sm tracking-tight font-semibold text-foreground">OpenQuiz</span>
        </div>
      </div>

      {/* Command Search Bar */}
      <div className="flex-1 max-w-xl min-w-0">
        <form onSubmit={handleSearch} className="relative hidden sm:block w-full">
          <div className="flex items-center h-9 w-full rounded-lg bg-secondary/60 hover:bg-secondary focus-within:bg-card focus-within:ring-2 focus-within:ring-primary/20 border border-border focus-within:border-primary px-3 transition-all gap-2.5">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm đề thi, môn học, ngân hàng câu hỏi..." 
              aria-label="Tìm kiếm đề thi"
              className="w-full bg-transparent text-xs sm:text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            {searchTerm ? (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="Xóa tìm kiếm"
                className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-card border border-border rounded">
                /
              </kbd>
            )}
          </div>
        </form>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <button 
          onClick={() => router.push('/dashboard/quizzes')}
          aria-label="Tìm kiếm đề thi"
          className="sm:hidden p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors cursor-pointer"
        >
          <Search className="w-4 h-4" />
        </button>

        {mounted && (
          <button
            type="button"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            aria-label="Chuyển đổi giao diện sáng/tối"
            title={resolvedTheme === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors cursor-pointer"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="w-4 h-4 text-foreground" />
            ) : (
              <Moon className="w-4 h-4 text-foreground" />
            )}
          </button>
        )}

        <NotificationDropdown />

        <div className="h-4 w-px bg-border mx-1 hidden sm:block" />

        <div 
          onClick={() => router.push('/dashboard/settings')}
          className="flex items-center gap-2 py-1 px-1.5 rounded-lg hover:bg-secondary transition-colors cursor-pointer group"
          title="Tài khoản cá nhân"
        >
          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors leading-tight">
              {user?.name || "Học viên"}
            </span>
            <span className="text-[10px] text-muted-foreground leading-tight">
              {user?.role === 'admin' ? 'Quản trị viên' : 'Học viên'}
            </span>
          </div>
          <div className="relative w-7 h-7 rounded-full overflow-hidden border border-border shrink-0">
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
