"use client";

import React from "react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Bell, Search, Menu } from "lucide-react";

export function Topbar() {
  const { user } = useAuthStore();

  return (
    <header className="h-[72px] bg-background/80 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between border-b border-border">
      <div className="flex items-center gap-4 flex-1">
        <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground hover:text-foreground">
          <Menu className="w-5 h-5" />
        </Button>
        <div className="relative hidden sm:block max-w-md w-full">
          <Search className="w-[18px] h-[18px] absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Tìm kiếm đề thi..." 
            className="h-10 w-full rounded-full border border-transparent bg-card pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-5">
        <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-white/5">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-[#EF4444] rounded-full border-2 border-[#020617]"></span>
        </button>

        <div className="h-6 w-px bg-white/10"></div>

        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold text-foreground group-hover:text-foreground transition-colors">{user?.name || "Học viên"}</span>
            <span className="text-[11px] text-muted-foreground capitalize">{user?.role === 'admin' ? 'Quản trị viên' : 'Tài khoản miễn phí'}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-[#0f172a] flex items-center justify-center overflow-hidden shadow-sm shadow-black/20">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-foreground">{user?.name?.charAt(0) || "S"}</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
