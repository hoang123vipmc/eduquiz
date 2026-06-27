import React from "react";
import { BarChart2 } from "lucide-react";

export default function StatisticsPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-card rounded-[20px] border border-border animate-in fade-in duration-500">
      <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
        <BarChart2 className="w-10 h-10 text-[#10B981]" />
      </div>
      <h3 className="text-2xl font-bold text-foreground mb-3">Thống kê chi tiết</h3>
      <p className="text-muted-foreground max-w-sm mb-8">
        Biểu đồ phân tích hiệu suất học tập, điểm mạnh và điểm yếu của bạn đang được xây dựng.
      </p>
      <div className="px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-full text-sm font-medium border border-emerald-500/20">
        Tính năng sắp ra mắt (Coming Soon)
      </div>
    </div>
  );
}
