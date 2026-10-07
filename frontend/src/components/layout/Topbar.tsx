"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Search, X, Menu } from "lucide-react";
import { NotificationDropdown } from "./NotificationDropdown";

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
    <header className="h-16 sm:h-[68px] bg-background sticky top-0 z-30 px-3 sm:px-6 flex items-center justify-between gap-3 sm:gap-6">
      {/* Mobile Hamburger & Logo */}
      <div className="flex items-center gap-2 sm:hidden shrink-0">
        <button
          onClick={onOpenMobile}
          aria-label="Mở menu"
          className="p-2 -ml-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div 
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 font-bold text-foreground cursor-pointer"
        >
          <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-xs font-black shadow-xs">
            OQ
          </div>
          <span className="text-base tracking-tight font-extrabold text-foreground">OpenQuiz</span>
        </div>
      </div>

      {/* Google Drive Signature Wide Search Pill */}
      <div className="flex-1 max-w-2xl min-w-0">
        <form onSubmit={handleSearch} className="relative hidden sm:block w-full">
          <div className="flex items-center h-11 sm:h-12 w-full rounded-full bg-secondary hover:bg-[#dfe4ec] dark:hover:bg-[#353637] focus-within:bg-card focus-within:shadow-md focus-within:ring-2 focus-within:ring-primary/20 border border-transparent focus-within:border-primary/30 px-4 transition-all gap-3">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm trong OpenQuiz (đề thi, môn học, câu hỏi...)" 
              aria-label="Tìm kiếm đề thi"
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="Xóa tìm kiếm"
                className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Right Controls: Notification & Google Profile Chip */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <button 
          onClick={() => router.push('/dashboard/quizzes')}
          aria-label="Tìm kiếm đề thi"
          className="sm:hidden p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary transition-colors"
        >
          <Search className="w-5 h-5" />
        </button>

        <NotificationDropdown />

        <div className="h-5 w-px bg-border/60 mx-1 hidden sm:block" />

        <div 
          onClick={() => router.push('/dashboard/settings')}
          className="flex items-center gap-2.5 p-1 pl-2 rounded-full hover:bg-secondary transition-colors cursor-pointer group"
          title="Tài khoản cá nhân"
        >
          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
              {user?.name || "Học viên"}
            </span>
            <span className="text-[10px] text-muted-foreground capitalize leading-tight">
              {user?.role === 'admin' ? 'Quản trị viên' : 'Học viên'}
            </span>
          </div>
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-border group-hover:border-primary/40 transition-colors shadow-2xs shrink-0">
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
