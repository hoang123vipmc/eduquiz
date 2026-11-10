"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { LayoutDashboard, BookOpen, Library, Trophy, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { DonateFloatingButton } from "@/components/common/DonateModal";

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
        <main className="flex-1 overflow-y-auto bg-background px-3 py-4 sm:px-6 sm:py-6 md:px-8 md:py-7 pb-24 md:pb-12">
          <div className="max-w-7xl mx-auto animate-in fade-in duration-200">
            {children}
            
            {/* Footer Disclaimer */}
            <footer className="mt-14 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
              <p className="font-medium text-foreground/80">
                OpenQuiz — Nền tảng ôn thi trắc nghiệm mở & phi lợi nhuận
              </p>
              <p>
                Dự án học thuật độc lập dành cho sinh viên. Hoàn toàn miễn phí.
              </p>
            </footer>
          </div>
        </main>

        <DonateFloatingButton />

        {/* Mobile Sticky Bottom Navigation Bar */}
        <nav 
          aria-label="Điều hướng di động"
          className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-md border-t border-border flex items-center justify-around h-14 px-1"
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
                    ? "text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="mt-0.5 tracking-tight">{item.label}</span>
              </Link>
            );
          })}
          
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Thêm mục khác"
            className={cn(
              "flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors",
              mobileOpen ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Menu className="w-4 h-4" />
            <span className="mt-0.5 tracking-tight">Thêm</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
