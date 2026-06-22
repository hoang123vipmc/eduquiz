import React from "react";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-[#0f172a] rounded-[20px] border border-white/5 animate-in fade-in duration-500">
      <div className="w-20 h-20 bg-[#18233b] rounded-full flex items-center justify-center mb-6">
        <Settings className="w-10 h-10 text-slate-400" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-3">Cài đặt hệ thống</h3>
      <p className="text-slate-400 max-w-sm mb-8">
        Trang tùy chỉnh tài khoản, đổi mật khẩu và cài đặt thông báo đang được phát triển.
      </p>
      <div className="px-4 py-2 bg-slate-500/10 text-slate-400 rounded-full text-sm font-medium border border-slate-500/20">
        Tính năng sắp ra mắt (Coming Soon)
      </div>
    </div>
  );
}
