import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { 
  LayoutDashboard, 
  Library, 
  History, 
  Settings, 
  Users, 
  FileQuestion,
  BarChart2,
  Trophy,
  LogOut,
  User
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  
  const studentLinks = [
    { name: "Tổng quan", href: "/dashboard", icon: LayoutDashboard },
    { name: "Đề thi của tôi", href: "/dashboard/quizzes", icon: Library },
    { name: "Ngân hàng câu hỏi", href: "/dashboard/bank", icon: FileQuestion },
    { name: "Thống kê", href: "/dashboard/statistics", icon: BarChart2 },
    { name: "Bảng xếp hạng", href: "/dashboard/leaderboard", icon: Trophy },
    { name: "Lịch sử", href: "/dashboard/history", icon: History },
    { name: "Cài đặt", href: "/dashboard/settings", icon: Settings },
  ];

  const adminLinks = [
    { name: "Tổng quan", href: "/admin", icon: LayoutDashboard },
    { name: "Quản lý Đề thi", href: "/admin/quizzes", icon: FileQuestion },
    { name: "Quản lý Người dùng", href: "/admin/users", icon: Users },
    { name: "Cài đặt Hệ thống", href: "/admin/settings", icon: Settings },
  ];

  const links = user?.role === "admin" ? adminLinks : studentLinks;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="w-[260px] bg-secondary border-r border-border hidden md:flex flex-col h-full text-foreground">
      
      {/* Brand & Slogan */}
      <div className="pt-8 pb-6 px-6">
        <div className="flex items-center gap-3 text-foreground font-bold text-2xl tracking-tight mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4F7CFF] to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-sm">EQ</span>
          </div>
          EduQuiz
        </div>
        <div className="text-[13px] text-muted-foreground font-medium pl-13">
          Học tập thông minh.
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 py-4 overflow-y-auto px-3 space-y-1 scrollbar-hide">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/") && link.href !== '/dashboard';
          // Fix exact match for dashboard
          const reallyActive = link.href === '/dashboard' ? pathname === '/dashboard' : isActive;

          return (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "group relative flex items-center gap-3 px-3 py-3 rounded-xl text-[15px] font-medium transition-all duration-250 ease-in-out",
                reallyActive 
                  ? "bg-muted text-foreground" 
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              {/* Active Indicator Bar */}
              {reallyActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#4F7CFF] rounded-r-full shadow-[0_0_8px_#4F7CFF]"></div>
              )}
              
              <Icon className={cn(
                "w-5 h-5 transition-transform duration-250 ease-in-out group-hover:translate-x-[2px]", 
                reallyActive ? "text-[#4F7CFF]" : "text-muted-foreground group-hover:text-foreground"
              )} />
              {link.name}
            </Link>
          );
        })}
      </div>

      {/* Bottom User Card */}
      <div className="p-4 mt-auto border-t border-border">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:bg-muted transition-colors duration-250 group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground truncate">
              {user?.name || "Student User"}
            </div>
            <div className="text-[13px] text-muted-foreground truncate">
              {user?.role === 'admin' ? 'Administrator' : 'Student Pro'}
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
