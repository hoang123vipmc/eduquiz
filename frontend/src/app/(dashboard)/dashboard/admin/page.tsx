"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import {
  Users, ShieldCheck, Ban, KeyRound, Trash2, ChevronRight,
  RefreshCcw, Search, AlertCircle, CheckCircle2, Loader2,
  UserCog, X, Shield, GraduationCap, BookOpen,
  ArrowLeft, TrendingUp
} from "lucide-react";

// ─────────────────────────────── Types ───────────────────────────────
interface UserRow {
  id: number;
  name: string;
  email: string;
  role: "admin" | "teacher" | "student";
  is_banned: boolean;
  avatar: string | null;
  created_at: string;
  last_login_at: string | null;
  attempts_count: number;
}

interface Overview {
  total_users: number;
  new_users_week: number;
  total_attempts: number;
  banned_users: number;
  admin_users: number;
}

interface UserDetail {
  user: UserRow;
  history: Array<{
    quiz_title: string;
    score: number;
    accuracy: number;
    time_taken_seconds: number;
    created_at: string;
  }>;
}

// ─────────────────────────────── Helpers ───────────────────────────────
const roleBadge = (role: string) => {
  if (role === "admin")
    return "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20";
  if (role === "teacher")
    return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20";
  return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20";
};

const roleIcon = (role: string) => {
  if (role === "admin") return <Shield className="w-3.5 h-3.5" />;
  if (role === "teacher") return <BookOpen className="w-3.5 h-3.5" />;
  return <GraduationCap className="w-3.5 h-3.5" />;
};

const roleLabel = (role: string) =>
  ({ admin: "Quản trị", teacher: "Giáo viên", student: "Học sinh" }[role] ?? role);

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

const fmtTime = (sec: number) => {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}p ${s}s`;
};

// ─────────────────────────────── Modal ───────────────────────────────
function ConfirmModal({
  title, message, confirmLabel, danger,
  onConfirm, onCancel, loading
}: {
  title: string; message: string; confirmLabel: string;
  danger?: boolean; loading?: boolean;
  onConfirm(): void; onCancel(): void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200">
        <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-border bg-muted text-foreground text-sm font-semibold hover:bg-muted/80 transition-all">
            Hủy
          </button>
          <button onClick={onConfirm} disabled={loading}
            className={cn("px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] flex items-center gap-2 disabled:opacity-60",
              danger ? "bg-rose-500 hover:bg-rose-600 text-white" : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm")}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const { user: authUser } = useAuthStore();

  // Strict Guard: Chỉ duy nhất tài khoản có role admin mới được truy cập
  useEffect(() => {
    if (authUser && authUser.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [authUser, router]);

  const [overview, setOverview] = useState<Overview | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);

  const [pagination, setPagination] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Detail panel
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Modals
  const [confirmModal, setConfirmModal] = useState<{
    title: string; message: string; confirmLabel: string; danger?: boolean;
    onConfirm(): void;
  } | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Reset password form
  const [resetPwdModal, setResetPwdModal] = useState<UserRow | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Toast
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Fetch overview ──
  useEffect(() => {
    if (authUser?.role === "admin") {
      api.get("/admin/overview").then(({ data }) => {
        if (data.success) setOverview(data.data);
      }).catch(() => {});
    }
  }, [authUser?.role]);


  // ── Fetch users ──
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", String(page));

      const { data } = await api.get(`/admin/users?${params}`);
      if (data.success) {
        setUsers(data.data.data);
        setPagination(data.data);
      }
    } catch {
      showToast("error", "Không thể tải danh sách người dùng.");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, page]);

  useEffect(() => {
    if (authUser?.role === "admin") {
      fetchUsers();
    }
  }, [fetchUsers, authUser?.role]);

  // ── View user detail ──
  const openDetail = async (u: UserRow) => {
    setDetailLoading(true);
    setSelectedUser(null);
    try {
      const { data } = await api.get(`/admin/users/${u.id}`);
      if (data.success) setSelectedUser(data.data);
    } catch {
      showToast("error", "Không thể tải thông tin chi tiết.");
    } finally {
      setDetailLoading(false);
    }
  };

  // ── Toggle ban ──
  const handleToggleBan = (u: UserRow) => {
    setConfirmModal({
      title: u.is_banned ? "Mở khóa tài khoản" : "Khóa tài khoản",
      message: u.is_banned
        ? `Người dùng ${u.name} (${u.email}) sẽ có thể đăng nhập trở lại.`
        : `Tài khoản ${u.name} (${u.email}) sẽ bị khóa và bị buộc đăng xuất ngay lập tức.`,
      confirmLabel: u.is_banned ? "Mở khóa" : "Khóa tài khoản",
      danger: !u.is_banned,
      onConfirm: async () => {
        setModalLoading(true);
        try {
          const { data } = await api.patch(`/admin/users/${u.id}/toggle-ban`);
          if (data.success) {
            showToast("success", data.message);
            setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_banned: data.data.is_banned } : x));
            if (selectedUser?.user.id === u.id) {
              setSelectedUser(prev => prev ? { ...prev, user: { ...prev.user, is_banned: data.data.is_banned } } : null);
            }
          }
        } catch (e: any) {
          showToast("error", e.response?.data?.message || "Lỗi thao tác.");
        } finally {
          setModalLoading(false);
          setConfirmModal(null);
        }
      }
    });
  };

  // ── Change role ──
  const handleChangeRole = (u: UserRow, newRole: string) => {
    setConfirmModal({
      title: "Thay đổi quyền hạn",
      message: `Đổi quyền của ${u.name} từ "${roleLabel(u.role)}" sang "${roleLabel(newRole)}"?`,
      confirmLabel: "Xác nhận",
      onConfirm: async () => {
        setModalLoading(true);
        try {
          const { data } = await api.patch(`/admin/users/${u.id}/role`, { role: newRole });
          if (data.success) {
            showToast("success", "Cập nhật quyền hạn thành công.");
            setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: data.data.role } : x));
            if (selectedUser?.user.id === u.id) {
              setSelectedUser(prev => prev ? { ...prev, user: { ...prev.user, role: data.data.role } } : null);
            }
          }
        } catch (e: any) {
          showToast("error", e.response?.data?.message || "Lỗi thao tác.");
        } finally {
          setModalLoading(false);
          setConfirmModal(null);
        }
      }
    });
  };

  // ── Delete user ──
  const handleDelete = (u: UserRow) => {
    setConfirmModal({
      title: "Xóa tài khoản",
      message: `Hành động này KHÔNG THỂ hoàn tác! Tài khoản ${u.name} (${u.email}) và toàn bộ dữ liệu liên quan sẽ bị xóa vĩnh viễn.`,
      confirmLabel: "Xóa vĩnh viễn",
      danger: true,
      onConfirm: async () => {
        setModalLoading(true);
        try {
          await api.delete(`/admin/users/${u.id}`);
          showToast("success", "Đã xóa tài khoản thành công.");
          setUsers(prev => prev.filter(x => x.id !== u.id));
          if (selectedUser?.user.id === u.id) setSelectedUser(null);
        } catch (e: any) {
          showToast("error", e.response?.data?.message || "Lỗi thao tác.");
        } finally {
          setModalLoading(false);
          setConfirmModal(null);
        }
      }
    });
  };

  // ── Reset password ──
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPwdModal) return;
    setPwdLoading(true);
    setPwdMsg(null);
    try {
      const { data } = await api.post(`/admin/users/${resetPwdModal.id}/reset-password`, { new_password: newPassword });
      if (data.success) {
        setPwdMsg({ type: "success", text: data.message });
        setNewPassword("");
        setTimeout(() => { setResetPwdModal(null); setPwdMsg(null); }, 1800);
      }
    } catch (e: any) {
      setPwdMsg({ type: "error", text: e.response?.data?.message || "Lỗi đặt lại mật khẩu." });
    } finally {
      setPwdLoading(false);
    }
  };

  if (!authUser) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (authUser.role !== "admin") {
    return null;
  }


  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">

      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed top-5 right-5 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold shadow-lg border animate-in slide-in-from-right-4 duration-300",
          toast.type === "success"
            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
            : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20"
        )}>
          {toast.type === "success"
            ? <CheckCircle2 className="w-4 h-4" />
            : <AlertCircle className="w-4 h-4" />}
          {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
          <UserCog className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quản lý người dùng</h1>
          <p className="text-sm text-muted-foreground">Xem và quản trị toàn bộ tài khoản trong hệ thống</p>
        </div>
      </div>

      {/* Overview Stats */}
      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: "Tổng người dùng", value: overview.total_users, color: "text-primary" },
            { label: "Mới trong tuần", value: overview.new_users_week, color: "text-emerald-500" },
            { label: "Lượt thi", value: overview.total_attempts, color: "text-blue-500" },
            { label: "Tài khoản bị khóa", value: overview.banned_users, color: "text-rose-500" },
            { label: "Quản trị viên", value: overview.admin_users, color: "text-amber-500" },
          ].map(stat => (
            <div key={stat.label} className="p-4 rounded-2xl bg-card border border-border text-center hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200">
              <p className={cn("text-3xl font-black", stat.color)}>{stat.value}</p>
              <p className="text-xs font-medium text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Main content: list + detail panel */}
      <div className={cn("flex gap-6", selectedUser || detailLoading ? "flex-col lg:flex-row" : "")}>

        {/* Users Table */}
        <div className={cn("flex-1 min-w-0 space-y-4", selectedUser || detailLoading ? "lg:w-1/2" : "w-full")}>
          
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Tìm theo tên hoặc email..."
                className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground focus:border-primary outline-none transition-colors"
              />
            </div>
            <select
              value={roleFilter}
              onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
              className="bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            >
              <option value="">Tất cả vai trò</option>
              <option value="admin">Quản trị</option>
              <option value="teacher">Giáo viên</option>
              <option value="student">Học sinh</option>
            </select>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="banned">Bị khóa</option>
            </select>
            <button
              onClick={fetchUsers}
              className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title="Làm mới"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Table */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : users.length === 0 ? (
              <div className="py-16 text-center">
                <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-sm text-muted-foreground">Không tìm thấy tài khoản nào.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Người dùng</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Vai trò</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Ngày đăng ký</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Lượt thi</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trạng thái</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map(u => (
                      <tr
                        key={u.id}
                        className={cn(
                          "hover:bg-muted/30 transition-colors cursor-pointer",
                          selectedUser?.user.id === u.id && "bg-muted/50"
                        )}
                        onClick={() => openDetail(u)}
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0 text-primary-foreground text-xs font-bold">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground truncate">{u.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 hidden sm:table-cell">
                          <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold", roleBadge(u.role))}>
                            {roleIcon(u.role)} {roleLabel(u.role)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground hidden md:table-cell">{fmtDate(u.created_at)}</td>
                        <td className="px-4 py-3.5 text-muted-foreground hidden lg:table-cell">{u.attempts_count}</td>
                        <td className="px-4 py-3.5">
                          {u.is_banned ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                              <Ban className="w-3 h-3" /> Bị khóa
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" /> Hoạt động
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.last_page > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <p>Hiển thị {pagination.from}–{pagination.to} trong {pagination.total} tài khoản</p>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-40 transition-colors"
                >Trước</button>
                <button
                  disabled={page >= pagination.last_page}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-40 transition-colors"
                >Sau</button>
              </div>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {(selectedUser || detailLoading) && (
          <div className="lg:w-[380px] shrink-0 bg-card border border-border rounded-2xl p-5 space-y-5 self-start animate-in fade-in slide-in-from-right-4 duration-300">
            {detailLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-7 h-7 animate-spin text-primary" />
              </div>
            ) : selectedUser && (
              <>
                {/* Close */}
                <button onClick={() => setSelectedUser(null)}
                  className="float-right p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>

                {/* Avatar & identity */}
                <div className="flex items-center gap-4 pt-1">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-xl font-black shrink-0">
                    {selectedUser.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-foreground text-base truncate">{selectedUser.user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{selectedUser.user.email}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold", roleBadge(selectedUser.user.role))}>
                        {roleIcon(selectedUser.user.role)} {roleLabel(selectedUser.user.role)}
                      </span>
                      {selectedUser.user.is_banned && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          <Ban className="w-3 h-3" /> Bị khóa
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Meta info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-muted/40 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-0.5">Ngày đăng ký</p>
                    <p className="font-semibold text-foreground">{fmtDate(selectedUser.user.created_at)}</p>
                  </div>
                  <div className="p-3 bg-muted/40 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-0.5">Đăng nhập lần cuối</p>
                    <p className="font-semibold text-foreground">{fmtDate(selectedUser.user.last_login_at)}</p>
                  </div>
                  <div className="p-3 bg-muted/40 rounded-xl col-span-2">
                    <p className="text-xs text-muted-foreground mb-0.5">Tổng số lượt thi</p>
                    <p className="font-semibold text-foreground">{selectedUser.user.attempts_count} lượt</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Thao tác</p>

                  {/* Toggle ban */}
                  <button
                    onClick={() => handleToggleBan(selectedUser.user)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold transition-all active:scale-[0.98]",
                      selectedUser.user.is_banned
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20"
                        : "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400 hover:bg-rose-500/20"
                    )}
                  >
                    {selectedUser.user.is_banned ? <CheckCircle2 className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                    {selectedUser.user.is_banned ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                  </button>

                  {/* Change role */}
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-muted-foreground shrink-0" />
                    <select
                      value={selectedUser.user.role}
                      onChange={e => handleChangeRole(selectedUser.user, e.target.value)}
                      className="flex-1 bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                    >
                      <option value="student">Học sinh</option>
                      <option value="teacher">Giáo viên</option>
                      <option value="admin">Quản trị viên</option>
                    </select>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">Đổi vai trò</span>
                  </div>

                  {/* Reset password */}
                  <button
                    onClick={() => { setResetPwdModal(selectedUser.user); setNewPassword(""); setPwdMsg(null); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-sm font-semibold transition-all active:scale-[0.98]"
                  >
                    <KeyRound className="w-4 h-4 text-amber-500" /> Đặt lại mật khẩu
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(selectedUser.user)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-700 dark:text-rose-400 text-sm font-semibold transition-all active:scale-[0.98]"
                  >
                    <Trash2 className="w-4 h-4" /> Xóa tài khoản vĩnh viễn
                  </button>
                </div>

                {/* History */}
                {selectedUser.history.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5" /> Lịch sử thi gần đây
                    </p>
                    <div className="space-y-2">
                      {selectedUser.history.map((h, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl text-xs gap-2">
                          <p className="font-medium text-foreground truncate flex-1">{h.quiz_title || "Đề thi"}</p>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={cn("font-bold", h.score >= 50 ? "text-emerald-500" : "text-rose-500")}>
                              {h.score}/100
                            </span>
                            <span className="text-muted-foreground">{fmtTime(h.time_taken_seconds)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel={confirmModal.confirmLabel}
          danger={confirmModal.danger}
          loading={modalLoading}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {/* Reset Password Modal */}
      {resetPwdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-foreground mb-1">Đặt lại mật khẩu</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Tài khoản: <span className="font-semibold text-foreground">{resetPwdModal.name}</span>
            </p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Mật khẩu mới (tối thiểu 6 ký tự)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Nhập mật khẩu mới..."
                  className="w-full bg-background border border-border focus:border-primary text-foreground rounded-xl px-4 py-3 outline-none transition-colors text-sm"
                />
              </div>
              {pwdMsg && (
                <div className={cn("flex items-center gap-2 p-3 rounded-xl text-sm border",
                  pwdMsg.type === "success"
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20")}>
                  {pwdMsg.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  {pwdMsg.text}
                </div>
              )}
              <div className="flex gap-3 justify-end pt-1">
                <button type="button" onClick={() => setResetPwdModal(null)}
                  className="px-4 py-2 rounded-xl border border-border bg-muted text-foreground text-sm font-semibold hover:bg-muted/80 transition-all">
                  Hủy
                </button>
                <button type="submit" disabled={pwdLoading || !newPassword}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-60 flex items-center gap-2 shadow-sm">
                  {pwdLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
