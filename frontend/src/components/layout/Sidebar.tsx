import React, { useEffect } from "react";
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
  User,
  X,
  CalendarCheck,
  Bookmark,
  Megaphone
} from "lucide-react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  // Khóa cuộn trang khi menu trượt mở trên điện thoại
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);
  
  const studentLinks = [
    { name: "Tổng quan", href: "/dashboard", icon: LayoutDashboard },
    { name: "Lịch thi & Điểm thi", href: "/dashboard/schedule", icon: CalendarCheck, badge: "ITC" },
    { name: "Danh sách đề thi", href: "/dashboard/quizzes", icon: BookOpen },
    { name: "Đề thi của tôi", href: "/dashboard/my-quizzes", icon: Library },
    { name: "Ngân hàng câu hỏi", href: "/dashboard/bank", icon: FileQuestion },
    { name: "Sổ tay câu hỏi", href: "/dashboard/bookmarks", icon: Bookmark, badge: "Hot" },
    { name: "Thống kê", href: "/dashboard/statistics", icon: BarChart2 },
    { name: "Bảng xếp hạng", href: "/dashboard/leaderboard", icon: Trophy },
    { name: "Lịch sử", href: "/dashboard/history", icon: History },
    { name: "Cài đặt", href: "/dashboard/settings", icon: Settings },
  ];

  const adminLinks = [
    { name: "Tổng quan", href: "/dashboard", icon: LayoutDashboard },
    { name: "Lịch thi & Điểm thi", href: "/dashboard/schedule", icon: CalendarCheck, badge: "ITC" },
    { name: "Danh sách đề thi", href: "/dashboard/quizzes", icon: BookOpen },
    { name: "Đề thi của tôi", href: "/dashboard/my-quizzes", icon: Library },
    { name: "Ngân hàng câu hỏi", href: "/dashboard/bank", icon: FileQuestion },
    { name: "Sổ tay câu hỏi", href: "/dashboard/bookmarks", icon: Bookmark, badge: "Hot" },
    { name: "Thống kê", href: "/dashboard/statistics", icon: BarChart2 },
    { name: "Bảng xếp hạng", href: "/dashboard/leaderboard", icon: Trophy },
    { name: "Lịch sử", href: "/dashboard/history", icon: History },
    { name: "───────────", href: "#", icon: Settings, isDivider: true },
    { name: "Quản lý người dùng", href: "/dashboard/admin", icon: Users },
    { name: "Quản lý thông báo", href: "/dashboard/admin/notifications", icon: Megaphone, badge: "Mới" },
    { name: "Cài đặt", href: "/dashboard/settings", icon: Settings },
  ];

  const isSuperAdmin = user?.role === "admin" 
    || user?.email === "hoangdeptraivodich12@gmail.com" 
    || user?.email?.startsWith("admin@") 
    || user?.name?.toLowerCase() === "hoang";

  const links = isSuperAdmin ? adminLinks : studentLinks;

  const [showLogoutModal, setShowLogoutModal] = React.useState(false);

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    onClose?.();
    logout();
    router.push("/login");
  };

  const navContent = (
    <div className="flex flex-col h-full text-foreground">
      {/* Brand Header */}
      <div className="pt-5 sm:pt-6 pb-4 sm:pb-5 px-4 sm:px-5 border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-violet-500 to-purple-600" />
            <div className="absolute inset-0 flex items-center justify-center text-white font-black text-sm">
              OQ
            </div>
          </div>
          <div>
            <div className="font-black text-lg tracking-tight leading-tight gradient-text">
              OpenQuiz
            </div>
            <div className="text-[10px] text-muted-foreground font-medium tracking-wide">
              Học tập phi lợi nhuận ✦
            </div>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            aria-label="Đóng menu"
            className="md:hidden p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted active:scale-90 active:rotate-90 transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* User Info Card */}
      <div className="p-2.5 mx-3 mt-3 mb-1 rounded-xl bg-secondary/80 border border-border/60 flex items-center justify-between gap-2 hover:border-primary/30 transition-colors">
        <div 
          onClick={() => {
            onClose?.();
            router.push('/dashboard/settings');
          }}
          className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group"
          title="Xem thông tin tài khoản"
        >
          <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-primary/20 shrink-0 group-hover:border-primary/50 transition-colors">
            <img 
              src={user?.avatar || "/images/avatar-student.jpg"} 
              alt={user?.name || "Avatar"} 
              className="w-full h-full object-cover" 
            />
            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-full" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs sm:text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
              {user?.name || "Học viên"}
            </div>
            <div className="text-[10px] text-muted-foreground truncate capitalize flex items-center gap-1">
              {isSuperAdmin ? (
                <><span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />Quản trị viên</>
              ) : (
                <><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />Học viên</>
              )}
            </div>
          </div>
        </div>

        <button 
          onClick={() => setShowLogoutModal(true)}
          aria-label="Đăng xuất tài khoản"
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold text-rose-500 hover:text-rose-600 bg-rose-500/8 hover:bg-rose-500/15 border border-rose-500/15 active:scale-90 transition-all shrink-0"
          title="Đăng xuất tài khoản"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Out</span>
        </button>
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
                "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.97]",
                reallyActive 
                  ? "bg-primary/10 text-primary font-semibold" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              {reallyActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-gradient-to-b from-primary to-violet-500 rounded-r-full" />
              )}
              
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 shrink-0",
                reallyActive 
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground group-hover:text-foreground"
              )}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="flex-1 truncate">{link.name}</span>
              {(link as any).badge && (
                <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold border border-primary/20">
                  {(link as any).badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Bottom badge */}
      <div className="p-3 mt-auto border-t border-border/30">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/8 via-primary/5 to-transparent border border-primary/10 p-3">
          <div className="font-bold text-xs text-foreground flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            OpenQuiz Phi lợi nhuận
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Dự án cá nhân phục vụ học tập và nghiên cứu, miễn phí 100%.
          </p>
          <div className="absolute -bottom-3 -right-3 w-16 h-16 bg-primary/5 rounded-full blur-xl" />
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

      {/* Mobile Drawer: Trượt mượt mà 2 chiều từ bên PHẢI sang tương ứng với nút Thêm bên phải */}
      <div 
        className={cn(
          "fixed inset-0 z-50 md:hidden transition-all duration-300",
          isOpen ? "visible pointer-events-auto" : "invisible pointer-events-none"
        )}
      >
        {/* Nền mờ kính mờ ảo (Backdrop Fade in/out) */}
        <div 
          className={cn(
            "fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity duration-300 ease-out",
            isOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={onClose}
        />
        {/* Khung menu: Neo ở bên PHẢI, trượt vào và trượt ra êm ái */}
        <aside 
          className={cn(
            "fixed top-0 right-0 bottom-0 w-[290px] max-w-[84vw] bg-card border-l border-border z-10 flex flex-col h-full shadow-2xl transition-transform duration-300 ease-out will-change-transform",
            isOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          {navContent}
        </aside>
      </div>

      {/* Modal Xác nhận Đăng xuất */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="fixed inset-0"
            onClick={() => setShowLogoutModal(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mx-auto shadow-xs">
              <LogOut className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Bạn có muốn đăng xuất?</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                Bạn có chắc chắn muốn đăng xuất khỏi tài khoản OpenQuiz không? Phiên đăng nhập hiện tại sẽ kết thúc.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="w-full py-2.5 px-4 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition-colors active:scale-95"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="w-full py-2.5 px-4 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-semibold shadow-xs transition-all active:scale-95"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
