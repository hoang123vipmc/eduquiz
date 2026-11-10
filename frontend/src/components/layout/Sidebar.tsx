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
  X,
  CalendarCheck,
  Bookmark,
  Megaphone,
  Plus,
  Award,
  Coffee,
  ChevronDown,
  QrCode
} from "lucide-react";
import { DonateModal } from "@/components/common/DonateModal";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

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
  const [showDonateModal, setShowDonateModal] = React.useState(false);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollDown, setCanScrollDown] = React.useState(false);

  const checkScroll = React.useCallback(() => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      setCanScrollDown(scrollHeight - scrollTop - clientHeight > 16);
    }
  }, []);

  React.useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    const timer = setTimeout(checkScroll, 200);
    return () => {
      window.removeEventListener("resize", checkScroll);
      clearTimeout(timer);
    };
  }, [checkScroll, pathname, isSuperAdmin, isOpen]);

  const isItemActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    if (href === "/dashboard/admin") {
      return pathname === "/dashboard/admin";
    }
    return pathname === href || (pathname.startsWith(href + "/") && href !== "#");
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    onClose?.();
    logout();
    router.push("/login");
  };

  const navContent = (
    <div className="flex flex-col h-full text-foreground bg-card">
      {/* Brand Header */}
      <div className="h-14 px-4 border-b border-border flex items-center justify-between shrink-0">
        <Link 
          href="/dashboard" 
          onClick={() => onClose?.()}
          className="flex items-center gap-2.5 group cursor-pointer"
        >
          <div className="w-7 h-7 rounded-lg bg-foreground text-background flex items-center justify-center font-mono text-xs font-bold tracking-tight">
            OQ
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-semibold text-sm tracking-tight text-foreground">
              OpenQuiz
            </span>
            <span className="text-[10px] font-mono text-muted-foreground border border-border rounded px-1 py-0.2 bg-secondary/60">
              2.6
            </span>
          </div>
        </Link>

        {onClose && (
          <button
            onClick={onClose}
            aria-label="Đóng menu"
            className="md:hidden p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Primary Action Button */}
      <div className="px-3 pt-3 pb-2 shrink-0">
        <button
          onClick={() => {
            onClose?.();
            router.push('/dashboard/my-quizzes');
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xs transition-all active:scale-[0.99] cursor-pointer group"
        >
          <span className="flex items-center gap-2 font-medium text-[13px]">
            <Plus className="w-4 h-4 stroke-[2.2]" />
            <span>Tạo đề thi mới</span>
          </span>
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary-foreground/15 text-primary-foreground/90">
            N
          </kbd>
        </button>
      </div>

      {/* Navigation Menu */}
      <div className="relative flex-1 min-h-0 flex flex-col">
        <div 
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex-1 py-1.5 overflow-y-auto px-2.5 space-y-0.5"
        >
          {links.map((link) => {
            const Icon = link.icon;
            
            if ((link as any).isDivider) {
              return (
                <div key={link.name} className="my-2 px-2">
                  <div className="h-px bg-border" />
                  <p className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider mt-2.5 mb-1 px-1">
                    Quản trị hệ thống
                  </p>
                </div>
              );
            }

            const reallyActive = isItemActive(link.href);

            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => onClose?.()}
                className={cn(
                  "group relative flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] transition-colors cursor-pointer",
                  reallyActive 
                    ? "bg-secondary text-foreground font-semibold" 
                    : "text-muted-foreground font-medium hover:bg-secondary/60 hover:text-foreground"
                )}
              >
                <Icon className={cn(
                  "w-4 h-4 shrink-0 transition-colors",
                  reallyActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )} />
                <span className="flex-1 truncate">{link.name}</span>
                {(link as any).badge && (
                  <span className={cn(
                    "px-1.5 py-0.2 rounded text-[10px] font-mono font-medium border",
                    reallyActive 
                      ? "bg-primary/10 text-primary border-primary/20" 
                      : "bg-secondary text-muted-foreground border-border"
                  )}>
                    {(link as any).badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {canScrollDown && (
          <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-10 flex flex-col items-center">
            <div className="w-full h-6 bg-gradient-to-t from-card to-transparent" />
            <button
              type="button"
              onClick={() => {
                if (scrollRef.current) {
                  scrollRef.current.scrollBy({ top: 140, behavior: "smooth" });
                }
              }}
              className="pointer-events-auto -mt-2 mb-1 flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-card hover:bg-secondary text-muted-foreground hover:text-foreground border border-border shadow-2xs text-[11px] font-medium transition-colors cursor-pointer"
              title="Cuộn xuống để xem thêm"
            >
              <span>Xem thêm</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Supporter QR Card */}
      <div className="px-2.5 pt-1.5 shrink-0">
        <div
          onClick={() => setShowDonateModal(true)}
          className="w-full p-2.5 rounded-lg bg-secondary/40 hover:bg-secondary/80 border border-border transition-colors cursor-pointer group flex items-center gap-2.5 select-none"
          title="Mở mã QR ủng hộ quỹ duy trì máy chủ"
        >
          <div className="relative w-11 h-11 rounded-md overflow-hidden border border-border bg-white p-0.5 shrink-0">
            <img
              src="/images/donate-qr.png"
              alt="Mã QR ủng hộ"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
              <Coffee className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              <span className="truncate">Ủng hộ máy chủ</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              Quét VietQR duy trì dự án
            </p>
          </div>
          <QrCode className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        </div>
      </div>

      {/* User Info Bar */}
      <div className="p-2.5 mt-2 border-t border-border flex items-center justify-between gap-2 shrink-0">
        <div 
          onClick={() => {
            onClose?.();
            router.push('/dashboard/settings');
          }}
          className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group"
          title="Cài đặt tài khoản"
        >
          <div className="relative w-7 h-7 rounded-full overflow-hidden border border-border shrink-0">
            <img 
              src={user?.avatar || "/images/avatar-student.jpg"} 
              alt={user?.name || "Avatar"} 
              className="w-full h-full object-cover" 
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {user?.name || "Học viên"}
            </div>
            <div className="text-[10px] text-muted-foreground truncate">
              {isSuperAdmin ? "Quản trị viên" : "Học viên"}
            </div>
          </div>
        </div>

        <button 
          onClick={() => setShowLogoutModal(true)}
          aria-label="Đăng xuất tài khoản"
          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 cursor-pointer"
          title="Đăng xuất tài khoản"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Left Rail */}
      <aside className="w-[248px] bg-card border-r border-border hidden md:flex flex-col h-full shrink-0 select-none">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      <div 
        className={cn(
          "fixed inset-0 z-50 md:hidden transition-all duration-200",
          isOpen ? "visible pointer-events-auto" : "invisible pointer-events-none"
        )}
      >
        <div 
          className={cn(
            "fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200",
            isOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={onClose}
        />
        <aside 
          className={cn(
            "fixed top-0 right-0 bottom-0 w-[280px] max-w-[84vw] bg-card border-l border-border z-10 flex flex-col h-full shadow-xl transition-transform duration-200 ease-out",
            isOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          {navContent}
        </aside>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            className="fixed inset-0"
            onClick={() => setShowLogoutModal(false)}
          />
          <div className="relative w-full max-w-sm rounded-xl bg-card border border-border p-5 shadow-xl animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 flex items-center justify-center shrink-0">
                <LogOut className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Đăng xuất tài khoản?</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Phiên làm việc hiện tại sẽ kết thúc.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="w-full py-2 px-3 rounded-lg border border-border bg-card hover:bg-secondary text-foreground text-xs font-medium transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="w-full py-2 px-3 rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-medium transition-colors cursor-pointer"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}

      <DonateModal 
        isOpen={showDonateModal} 
        onClose={() => setShowDonateModal(false)} 
      />
    </>
  );
}
