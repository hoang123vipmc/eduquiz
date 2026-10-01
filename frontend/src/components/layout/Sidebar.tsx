import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { 
  LayoutDashboard, 
  Library, 
  BookOpen,
  History, 
  Settings, 
  Users, 
  FileQuestion,
  BarChart2,
  Trophy,
  LogOut,
  User
} from "lucide-react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  
  const studentLinks = [
    { name: "Tổng quan", href: "/dashboard", icon: LayoutDashboard },
    { name: "Danh sách đề thi", href: "/dashboard/quizzes", icon: BookOpen },
    { name: "Đề thi của tôi", href: "/dashboard/my-quizzes", icon: Library },
    { name: "Ngân hàng câu hỏi", href: "/dashboard/bank", icon: FileQuestion },
    { name: "Thống kê", href: "/dashboard/statistics", icon: BarChart2 },
    { name: "Bảng xếp hạng", href: "/dashboard/leaderboard", icon: Trophy },
    { name: "Lịch sử", href: "/dashboard/history", icon: History },
    { name: "Cài đặt", href: "/dashboard/settings", icon: Settings },
  ];

  const adminLinks = [
    { name: "Tổng quan", href: "/dashboard", icon: LayoutDashboard },
    { name: "Danh sách đề thi", href: "/dashboard/quizzes", icon: BookOpen },
    { name: "Đề thi của tôi", href: "/dashboard/my-quizzes", icon: Library },
    { name: "Ngân hàng câu hỏi", href: "/dashboard/bank", icon: FileQuestion },
    { name: "Thống kê", href: "/dashboard/statistics", icon: BarChart2 },
    { name: "Bảng xếp hạng", href: "/dashboard/leaderboard", icon: Trophy },
    { name: "Lịch sử", href: "/dashboard/history", icon: History },
    { name: "───────────", href: "#", icon: Settings, isDivider: true },
    { name: "Quản lý người dùng", href: "/dashboard/admin", icon: Users },
    { name: "Cài đặt", href: "/dashboard/settings", icon: Settings },
  ];

  const links = user?.role === "admin" ? adminLinks : studentLinks;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const navContent = (
    <div className="flex flex-col h-full text-foreground">
      {/* Brand & Slogan */}
      <div className="pt-7 pb-6 px-6 border-b border-border/40">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-primary-foreground font-bold text-base shadow-sm shadow-primary/25">
            <span>OQ</span>
          </div>
          <div>
            <div className="text-foreground font-bold text-xl tracking-tight leading-tight">
              OpenQuiz
            </div>
            <div className="text-xs text-muted-foreground font-medium">
              Học tập phi lợi nhuận
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 py-4 overflow-y-auto px-3 space-y-1 scrollbar-hide">
        {links.map((link) => {
          const Icon = link.icon;
          
          // Render visual divider for admin section
          if ((link as any).isDivider) {
            return (
              <div key={link.name} className="my-2 px-3">
                <div className="h-px bg-border" />
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mt-3 mb-1 px-0.5">
                  Quản trị
                </p>
              </div>
            );
          }

          const isActive = pathname === link.href || (pathname.startsWith(link.href + "/") && link.href !== '/dashboard');
          const reallyActive = link.href === '/dashboard' ? pathname === '/dashboard' : isActive;

          return (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => onClose?.()}
              className={cn(
                "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                reallyActive 
                  ? "bg-primary/10 text-primary font-semibold" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {reallyActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-md"></div>
              )}
              
              <Icon className={cn(
                "w-5 h-5 transition-colors", 
                reallyActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )} />
              {link.name}
            </Link>
          );
        })}
      </div>

      {/* Non-profit & Educational Disclaimer */}
      <div className="px-3 pb-2">
        <div className="bg-primary/5 border border-primary/15 rounded-xl p-2.5 text-[11px] text-muted-foreground leading-snug">
          <div className="font-semibold text-foreground flex items-center gap-1 mb-0.5">
            <span>🌱</span> OpenQuiz Phi lợi nhuận
          </div>
          Dự án cá nhân phục vụ học tập và nghiên cứu công nghệ, miễn phí 100%.
        </div>
      </div>

      {/* Bottom User Card */}
      <div className="p-4 mt-auto border-t border-border/50">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-card border border-border/70 hover:border-border hover:bg-muted/40 transition-all group">
          <div className="w-9 h-9 rounded-full overflow-hidden border border-border shrink-0 shadow-xs">
            <img 
              src={user?.avatar || "/images/avatar-student.jpg"} 
              alt={user?.name || "Avatar"} 
              className="w-full h-full object-cover" 
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground truncate">
              {user?.name || "Học viên"}
            </div>
            <div className="text-[11px] text-muted-foreground truncate">
              {user?.role === 'admin' ? 'Quản trị viên' : 'Học viên'}
            </div>
          </div>
          <button 
            onClick={handleLogout}
            aria-label="Đăng xuất tài khoản"
            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors opacity-70 hover:opacity-100"
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-[260px] bg-secondary border-r border-border hidden md:flex flex-col h-full shrink-0">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={onClose}
          />
          <aside className="relative w-[280px] max-w-[80vw] bg-card border-r border-border z-10 flex flex-col h-full shadow-2xl animate-in slide-in-from-left duration-300">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
