import React from "react";
import { FileQuestion } from "lucide-react";

export default function QuestionBankPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-[#0f172a] rounded-[20px] border border-white/5 animate-in fade-in duration-500">
      <div className="w-20 h-20 bg-[#18233b] rounded-full flex items-center justify-center mb-6">
        <FileQuestion className="w-10 h-10 text-[#4F7CFF]" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-3">Ngân hàng câu hỏi</h3>
      <p className="text-slate-400 max-w-sm mb-8">
        Tính năng quản lý và phân loại từng câu hỏi riêng biệt đang được phát triển. Bạn sẽ sớm có thể tạo đề thi tự động từ ngân hàng này.
      </p>
      <div className="px-4 py-2 bg-blue-500/10 text-blue-400 rounded-full text-sm font-medium border border-blue-500/20">
        Tính năng sắp ra mắt (Coming Soon)
      </div>
    </div>
  );
}
