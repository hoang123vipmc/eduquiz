"use client";

import React, { useState } from "react";
import { Settings, User, Lock, Monitor, Moon, Sun, Loader2, CheckCircle2, AlertCircle, Upload, Image as ImageIcon, GraduationCap, ExternalLink } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useTheme } from "next-themes";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const { theme, setTheme } = useTheme();
  
  const [activeTab, setActiveTab] = useState<"account" | "security" | "appearance">("account");
  
  // Account Form
  const [name, setName] = useState(user?.name || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [studentId, setStudentId] = useState(user?.student_id || "");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: "", text: "" });

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setProfileMessage({ type: 'error', text: 'Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, WEBP).' });
        return;
      }
      
      // Đọc file thành data URL hiển thị xem trước tức thì
      const reader = new FileReader();
      reader.onload = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Tải ảnh lên server
      setIsUploadingAvatar(true);
      const formData = new FormData();
      formData.append('image', file);
      try {
        const { data } = await api.post('/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (data.success && data.url) {
          setAvatar(data.url);
        }
      } catch (err) {
        console.warn('Upload ảnh lên server thất bại, đang dùng dữ liệu ảnh trực tiếp', err);
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  };

  // Security Form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileMessage({ type: "", text: "" });
    try {
      const { data } = await api.put("/user/profile", { name, avatar, student_id: studentId.trim() || null });
      if (data.success) {
        updateUser({ name, avatar, student_id: studentId.trim() || null });
        setProfileMessage({ type: "success", text: "Cập nhật thông tin và ảnh đại diện thành công." });
      }
    } catch (error: any) {
      setProfileMessage({ type: "error", text: error.response?.data?.message || "Lỗi cập nhật thông tin." });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "Mật khẩu xác nhận không khớp." });
      return;
    }
    setIsChangingPassword(true);
    setPasswordMessage({ type: "", text: "" });
    try {
      const { data } = await api.put("/user/password", {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword
      });
      if (data.success) {
        setPasswordMessage({ type: "success", text: "Đổi mật khẩu thành công." });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error: any) {
      setPasswordMessage({ type: "error", text: error.response?.data?.message || "Lỗi đổi mật khẩu." });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cài đặt hệ thống</h1>
          <p className="text-muted-foreground text-sm">Quản lý thông tin tài khoản và tùy chỉnh giao diện</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Menu */}
        <div className="w-full md:w-64 flex flex-col gap-2 shrink-0">
          <button
            onClick={() => setActiveTab("account")}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors text-left",
              activeTab === "account" 
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <User className="w-5 h-5" /> Thông tin tài khoản
          </button>
          
          {/* Ẩn mục Đổi mật khẩu nếu dùng Google Login */}
          {!(user as any)?.provider_id && (
            <button
              onClick={() => setActiveTab("security")}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors text-left",
                activeTab === "security" 
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <Lock className="w-5 h-5" /> Đổi mật khẩu
            </button>
          )}

          <button
            onClick={() => setActiveTab("appearance")}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors text-left",
              activeTab === "appearance" 
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <Monitor className="w-5 h-5" /> Giao diện hiển thị
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-card border border-border rounded-[20px] p-6 shadow-sm min-h-[400px]">
          
          {/* Account Tab */}
          {activeTab === "account" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-bold text-foreground mb-6 pb-4 border-b border-border">Thông tin cá nhân</h3>
              
              <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-lg">
                {/* Avatar Section */}
                <div className="pb-6 border-b border-border/60 space-y-4">
                  <label className="block text-sm font-semibold text-foreground">Ảnh đại diện (Avatar)</label>
                  
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                    {/* Current Preview */}
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary shadow-sm bg-muted shrink-0 relative">
                      <img 
                        src={avatar || "/images/avatar-student.jpg"} 
                        alt="Avatar Preview" 
                        className="w-full h-full object-cover" 
                      />
                      {isUploadingAvatar && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                          <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                      )}
                    </div>

                    {/* Primary Actions: Upload File & URL */}
                    <div className="flex-1 space-y-3 w-full">
                      <div>
                        <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold cursor-pointer shadow-xs transition-all active:scale-95">
                          <Upload className="w-4 h-4" />
                          <span>Tải ảnh từ máy tính</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleAvatarFileChange} 
                            className="hidden" 
                          />
                        </label>
                        <span className="text-xs text-muted-foreground ml-3 block sm:inline mt-1 sm:mt-0">Hỗ trợ JPG, PNG, WEBP (tối đa 5MB)</span>
                      </div>

                      <div>
                        <input 
                          type="url" 
                          value={avatar} 
                          onChange={(e) => setAvatar(e.target.value)}
                          placeholder="Hoặc dán URL ảnh từ internet (https://...)"
                          className="w-full bg-background border border-border focus:border-primary text-foreground text-xs rounded-xl px-3.5 py-2.5 outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Preset Defaults */}
                  <div className="pt-2">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Hoặc chọn ảnh mẫu có sẵn (Lựa chọn mặc định):
                    </p>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {[
                        { name: "3D Học viên", url: "/images/avatar-student.jpg" },
                        { name: "Học viên Nữ", url: "https://api.dicebear.com/7.x/notionists/svg?seed=Aria" },
                        { name: "Coder", url: "https://api.dicebear.com/7.x/notionists/svg?seed=Felix" },
                        { name: "Học giả", url: "https://api.dicebear.com/7.x/notionists/svg?seed=Oliver" },
                        { name: "Sáng tạo", url: "https://api.dicebear.com/7.x/notionists/svg?seed=Maya" },
                      ].map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => setAvatar(preset.url)}
                          className={cn(
                            "w-11 h-11 rounded-full overflow-hidden border-2 transition-all p-0.5 hover:scale-110",
                            (avatar === preset.url || (!avatar && preset.url === "/images/avatar-student.jpg"))
                              ? "border-primary ring-2 ring-primary/20 scale-105"
                              : "border-border hover:border-primary/50 opacity-70 hover:opacity-100"
                          )}
                          title={preset.name}
                        >
                          <img src={preset.url} alt={preset.name} className="w-full h-full object-cover rounded-full" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Địa chỉ Email (Không thể đổi)</label>
                  <input 
                    type="email" 
                    value={user?.email || ""} 
                    disabled 
                    className="w-full bg-muted/50 border border-border text-muted-foreground rounded-xl px-4 py-3 outline-none opacity-70 cursor-not-allowed"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Họ và tên hiển thị</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nhập tên của bạn"
                    required
                    className="w-full bg-background border border-border focus:border-primary text-foreground rounded-xl px-4 py-3 outline-none transition-colors"
                  />
                </div>

                {/* Student ID Section */}
                <div className="rounded-xl border border-blue-200 dark:border-blue-800/50 bg-blue-50/30 dark:bg-blue-900/10 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <label className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                        Mã sinh viên (MSV)
                      </label>
                    </div>
                    {studentId && (
                      <a
                        href={`/dashboard/schedule?msv=${encodeURIComponent(studentId)}`}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        Xem lịch thi <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="VD: 2823231208 (không bắt buộc)"
                    maxLength={20}
                    className="w-full bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800/50 focus:border-blue-500 text-foreground rounded-xl px-4 py-2.5 outline-none transition-colors text-sm"
                  />
                  <p className="text-xs text-blue-600/70 dark:text-blue-400/70">
                    Website sẽ dùng MSV này để tự động gợi ý các đề thi phù hợp với lịch thi của bạn.
                  </p>
                </div>

                {profileMessage.text && (
                  <div className={cn("p-3 rounded-xl text-sm flex items-center gap-2.5 transition-all duration-200", 
                    profileMessage.type === "success" 
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20" 
                      : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"
                  )}>
                    {profileMessage.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                    )}
                    <span>{profileMessage.text}</span>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isUpdatingProfile || !name}
                  className="bg-primary hover:bg-primary/90 active:scale-[0.98] text-primary-foreground font-semibold px-6 py-3 rounded-xl transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2 shadow-sm"
                >
                  {isUpdatingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : "Lưu thay đổi"}
                </button>
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-bold text-foreground mb-6 pb-4 border-b border-border">Đổi mật khẩu</h3>
              
              <form onSubmit={handleChangePassword} className="space-y-5 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Mật khẩu hiện tại</label>
                  <input 
                    type="password" 
                    value={currentPassword} 
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full bg-background border border-border focus:border-primary text-foreground rounded-xl px-4 py-3 outline-none transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Mật khẩu mới (Tối thiểu 6 ký tự)</label>
                  <input 
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full bg-background border border-border focus:border-primary text-foreground rounded-xl px-4 py-3 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Nhập lại mật khẩu mới</label>
                  <input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full bg-background border border-border focus:border-primary text-foreground rounded-xl px-4 py-3 outline-none transition-colors"
                  />
                </div>

                {passwordMessage.text && (
                  <div className={cn("p-3 rounded-xl text-sm flex items-center gap-2.5 transition-all duration-200", 
                    passwordMessage.type === "success" 
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20" 
                      : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"
                  )}>
                    {passwordMessage.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                    )}
                    <span>{passwordMessage.text}</span>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                  className="bg-primary hover:bg-primary/90 active:scale-[0.98] text-primary-foreground font-semibold px-6 py-3 rounded-xl transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2 shadow-sm"
                >
                  {isChangingPassword ? <Loader2 className="w-5 h-5 animate-spin" /> : "Đổi mật khẩu"}
                </button>
              </form>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === "appearance" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-bold text-foreground mb-6 pb-4 border-b border-border">Giao diện hiển thị</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Light Mode */}
                <button 
                  onClick={() => setTheme('light')}
                  className={cn(
                    "flex flex-col items-center p-4 rounded-2xl border-2 transition-all",
                    theme === 'light' ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/50"
                  )}
                >
                  <div className="w-full h-24 bg-slate-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden border border-slate-200">
                    <Sun className="w-8 h-8 text-amber-500" />
                  </div>
                  <span className="font-semibold text-foreground">Sáng (Light)</span>
                </button>

                {/* Dark Mode */}
                <button 
                  onClick={() => setTheme('dark')}
                  className={cn(
                    "flex flex-col items-center p-4 rounded-2xl border-2 transition-all",
                    theme === 'dark' ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/50"
                  )}
                >
                  <div className="w-full h-24 bg-card rounded-lg mb-4 flex items-center justify-center overflow-hidden border border-border">
                    <Moon className="w-8 h-8 text-blue-400" />
                  </div>
                  <span className="font-semibold text-foreground">Tối (Dark)</span>
                </button>

                {/* System Mode */}
                <button 
                  onClick={() => setTheme('system')}
                  className={cn(
                    "flex flex-col items-center p-4 rounded-2xl border-2 transition-all",
                    theme === 'system' ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/50"
                  )}
                >
                  <div className="w-full h-24 bg-gradient-to-r from-slate-100 to-[#0f172a] rounded-lg mb-4 flex items-center justify-center overflow-hidden border border-border">
                    <Monitor className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <span className="font-semibold text-foreground">Theo hệ thống</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
