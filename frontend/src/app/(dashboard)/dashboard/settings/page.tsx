"use client";

import React, { useState } from "react";
import { Settings, User, Lock, Monitor, Moon, Sun, Loader2, CheckCircle2 } from "lucide-react";
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
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: "", text: "" });

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
      const { data } = await api.put("/user/profile", { name });
      if (data.success) {
        updateUser({ name });
        setProfileMessage({ type: "success", text: "Cập nhật thông tin thành công." });
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
              
              <form onSubmit={handleUpdateProfile} className="space-y-5 max-w-md">
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

                {profileMessage.text && (
                  <div className={cn("p-3 rounded-lg text-sm flex items-center gap-2", 
                    profileMessage.type === "success" ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                  )}>
                    {profileMessage.type === "success" && <CheckCircle2 className="w-4 h-4" />}
                    {profileMessage.text}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isUpdatingProfile || !name}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
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
                  <div className={cn("p-3 rounded-lg text-sm flex items-center gap-2", 
                    passwordMessage.type === "success" ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                  )}>
                    {passwordMessage.type === "success" && <CheckCircle2 className="w-4 h-4" />}
                    {passwordMessage.text}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
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
