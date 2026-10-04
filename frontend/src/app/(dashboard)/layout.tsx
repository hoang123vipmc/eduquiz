"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { LayoutDashboard, BookOpen, Library, Trophy, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  useEffect(() => {
    setMounted(true);
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (mounted && !isAuthenticated && !localStorage.getItem('auth_token')) {
      router.push("/login");
    }
  }, [isAuthenticated, router, mounted]);

  if (!mounted) return null;
  if (!isAuthenticated && !localStorage.getItem('auth_token')) return null;

  const bottomNavItems = [
    { label: "Tổng quan", href: "/dashboard", icon: LayoutDashboard },
    { label: "Đề thi", href: "/dashboard/quizzes", icon: BookOpen },
    { label: "Đề của tôi", href: "/dashboard/my-quizzes", icon: Library },
    { label: "BXH", href: "/dashboard/leaderboard", icon: Trophy },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Topbar onOpenMobile={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 lg:p-8 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
            
            {/* Footer Disclaimer */}
            <footer className="mt-12 sm:mt-16 py-6 border-t border-border/40 text-center text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground/80">
                OpenQuiz — Nền tảng ôn thi trắc nghiệm mở & phi lợi nhuận
              </p>
              <p>
                Dự án cá nhân độc lập phục vụ mục đích học tập, ôn thi và nghiên cứu công nghệ cho sinh viên. Hoàn toàn miễn phí.
              </p>
            </footer>
          </div>
        </main>

        {/* Mobile Sticky Bottom Navigation Bar */}
        <nav 
          aria-label="Điều hướng di động"
          className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-md border-t border-border flex items-center justify-around h-16 px-1 shadow-lg"
        >
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors",
                  isActive
                    ? "text-primary font-bold"
                    : "text-muted-foreground hover:text-foreground active:scale-95"
                )}
              >
                <div className={cn("p-1 rounded-xl transition-all", isActive && "bg-primary/10")}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="mt-0.5 tracking-tight">{item.label}</span>
              </Link>
            );
          })}
          
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Thêm mục khác"
            className="flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground active:scale-90 transition-all duration-150 group"
          >
            <div className={cn(
              "p-1 rounded-xl transition-all duration-200 group-hover:bg-primary/10 group-active:scale-80 group-active:rotate-12",
              mobileOpen && "bg-primary/15 text-primary scale-105"
            )}>
              <Menu className={cn(
                "w-5 h-5 transition-transform duration-300 ease-out",
                mobileOpen && "rotate-90 text-primary scale-110"
              )} />
            </div>
            <span className={cn(
              "mt-0.5 tracking-tight transition-colors duration-200",
              mobileOpen && "text-primary font-bold"
            )}>Thêm</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
