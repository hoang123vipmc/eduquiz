import React from "react";
import { Trophy } from "lucide-react";

export default function LeaderboardPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-[#0f172a] rounded-[20px] border border-white/5 animate-in fade-in duration-500">
      <div className="w-20 h-20 bg-[#18233b] rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
        <Trophy className="w-10 h-10 text-[#F59E0B]" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-3">Bảng xếp hạng</h3>
      <p className="text-slate-400 max-w-sm mb-8">
        Hệ thống xếp hạng, huy hiệu và thi đua với những người học khác đang được hoàn thiện. Hãy đón chờ!
      </p>
      <div className="px-4 py-2 bg-orange-500/10 text-orange-400 rounded-full text-sm font-medium border border-orange-500/20">
        Tính năng sắp ra mắt (Coming Soon)
      </div>
    </div>
  );
}
