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
  Megaphone,
  Plus,
  Award
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
    { name: "Lịch thi học kỳ", href: "/dashboard/schedule", icon: CalendarCheck },
    { name: "Bảng điểm thi", href: "/dashboard/scores", icon: Award, badge: "Mới" },
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
    { name: "Lịch thi học kỳ", href: "/dashboard/schedule", icon: CalendarCheck },
    { name: "Bảng điểm thi", href: "/dashboard/scores", icon: Award, badge: "Mới" },
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
    || user?.email === "hoangdeptraivodich12@gmail.com";

  const links = isSuperAdmin ? adminLinks : studentLinks;

  const [showLogoutModal, setShowLogoutModal] = React.useState(false);

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    onClose?.();
    logout();
    router.push("/login");
  };

  const navContent = (
    <div className="flex flex-col h-full text-foreground bg-background">
      {/* Brand Header */}
      <div className="pt-4 pb-2 px-5 flex items-center justify-between">
        <Link 
          href="/dashboard" 
          onClick={() => onClose?.()}
          className="flex items-center gap-3 group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-card border border-border shadow-xs flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="font-extrabold text-base tracking-tight text-foreground leading-tight">
              OpenQuiz
            </div>
            <div className="text-[11px] text-muted-foreground font-medium">
              Kho đề & Luyện thi
            </div>
          </div>
        </Link>

        {onClose && (
          <button
            onClick={onClose}
            aria-label="Đóng menu"
            className="md:hidden p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Google Drive "+ Mới" (Tạo đề thi mới) Pill Button */}
      <div className="px-3 pt-2 pb-2">
        <button
          onClick={() => {
            onClose?.();
            router.push('/dashboard/my-quizzes');
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-card hover:bg-secondary text-foreground border border-border shadow-xs hover:shadow-md transition-all active:scale-[0.98] cursor-pointer group"
        >
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:rotate-90 transition-transform">
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="font-semibold text-sm">Mới / Tạo đề thi</span>
        </button>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 py-1 overflow-y-auto px-3 space-y-1 scrollbar-hide">
        {links.map((link) => {
          const Icon = link.icon;
          
          // Render visual divider for admin section
          if ((link as any).isDivider) {
            return (
              <div key={link.name} className="my-2 px-3">
                <div className="h-px bg-border/60" />
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mt-3 mb-1 px-1">
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
                "group relative flex items-center gap-3.5 px-4 py-2.5 rounded-full text-sm font-medium transition-colors cursor-pointer",
                reallyActive 
                  ? "bg-accent text-accent-foreground font-semibold" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 shrink-0 transition-colors",
                reallyActive ? "text-accent-foreground" : "text-muted-foreground group-hover:text-foreground"
              )} />
              <span className="flex-1 truncate">{link.name}</span>
              {(link as any).badge && (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                  reallyActive 
                    ? "bg-card text-accent-foreground border-accent-foreground/20" 
                    : "bg-muted text-primary border-primary/20"
                )}>
                  {(link as any).badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* User Info Card */}
      <div className="p-2 mx-3 my-2 rounded-2xl bg-card border border-border/80 flex items-center justify-between gap-2 shadow-2xs">
        <div 
          onClick={() => {
            onClose?.();
            router.push('/dashboard/settings');
          }}
          className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group"
          title="Xem thông tin tài khoản"
        >
          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-border shrink-0">
            <img 
              src={user?.avatar || "/images/avatar-student.jpg"} 
              alt={user?.name || "Avatar"} 
              className="w-full h-full object-cover" 
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
              {user?.name || "Học viên"}
            </div>
            <div className="text-[10px] text-muted-foreground truncate capitalize">
              {isSuperAdmin ? "Quản trị viên" : "Học viên"}
            </div>
          </div>
        </div>

        <button 
          onClick={() => setShowLogoutModal(true)}
          aria-label="Đăng xuất tài khoản"
          className="p-2 rounded-full text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 active:scale-90 transition-all shrink-0"
          title="Đăng xuất tài khoản"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-[260px] bg-background border-r border-border/60 hidden md:flex flex-col h-full shrink-0 select-none">
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
