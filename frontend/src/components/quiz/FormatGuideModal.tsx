import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink } from 'lucide-react';

interface FormatGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'Dạng 1 đáp án' | 'Dạng nhiều đáp án' | 'Dạng điền từ' | 'Dạng đọc hiểu';

const EXAMPLES: Record<TabType, string> = {
  'Dạng 1 đáp án': `'Phần 1

When we went back to the bookstore, the bookseller _ the book we wanted.
A. sold
*B. had sold
C. sells
D. has sold`,
  'Dạng nhiều đáp án': `'Phần 2

Chọn các ngôn ngữ lập trình dùng để phát triển Web Frontend:
*A. JavaScript
B. Python
C. C++
*D. TypeScript`,
  'Dạng điền từ': `'Phần 3

Điền vào chỗ trống đoạn mã sau để khai báo một biến hằng số trong JavaScript:
___ PI = 3.14;
*A. const
B. let
C. var
D. function`,
  'Dạng đọc hiểu': `'Phần 4

Đọc đoạn văn sau và trả lời câu hỏi:
"Hà Nội là thủ đô của nước Cộng hòa Xã hội chủ nghĩa Việt Nam, đồng thời cũng là kinh đô của hầu hết các vương triều phong kiến Việt Nam trước đây..."<br />Hỏi: Hà Nội là thủ đô của nước nào?
A. Lào
*B. Việt Nam
C. Campuchia
D. Thái Lan`
};

export function FormatGuideModal({ isOpen, onClose }: FormatGuideModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('Dạng 1 đáp án');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(EXAMPLES[activeTab]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const tabs: TabType[] = ['Dạng 1 đáp án', 'Dạng nhiều đáp án', 'Dạng điền từ', 'Dạng đọc hiểu'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="relative flex items-center justify-center p-5 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">Cấu trúc soạn thảo câu hỏi bằng văn bản</h2>
          <button 
            onClick={onClose}
            className="absolute right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[80vh]">
          
          {/* Phần 1: Quy tắc soạn câu hỏi */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-800 mb-3">Quy tắc soạn câu hỏi</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600 text-sm">
              <li>Để tạo phần thi mới, viết dấu nháy <code className="bg-gray-100 px-1 py-0.5 rounded text-red-500">'</code> ở đầu dòng.</li>
              <li>Mỗi câu hỏi cách nhau 1 dòng hoặc nhiều dòng.</li>
              <li>Đáp án đúng là đáp án có dấu <code className="bg-gray-100 px-1 py-0.5 rounded text-red-500">*</code> đằng trước.</li>
              <li>Nếu muốn xuống dòng trong câu hỏi hoặc đáp án thì bạn cần bổ sung thêm ký tự <code className="bg-gray-100 px-1 py-0.5 rounded text-blue-600">&lt;br /&gt;</code> tại điểm muốn xuống dòng.</li>
              <li>Nếu câu hỏi sai cấu trúc trên, hệ thống sẽ báo lỗi và câu hỏi không được hiển thị.</li>
            </ul>
          </div>

          {/* Phần 2: Tab Ví dụ & Hướng dẫn */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-4">Ví dụ và hướng dẫn chi tiết từng loại câu hỏi:</h3>
            
            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-colors border ${
                    activeTab === tab 
                      ? 'bg-blue-600 text-foreground border-blue-600' 
                      : 'bg-transparent text-blue-600 border-blue-600 hover:bg-blue-50'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Phần 3: Khung hiển thị Ví dụ */}
            <div className="relative">
              <div className="border border-gray-200 rounded-lg p-5 bg-gray-50/50">
                <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap">
                  {EXAMPLES[activeTab]}
                </pre>
              </div>
              <div className="mt-3 flex justify-end">
                <button 
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-foreground bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-5 border-t border-gray-100 space-y-2">
          <p className="font-semibold text-gray-800 text-center text-sm">
            Hãy sao chép cấu trúc văn bản trên và dán vào phần soạn thảo để xem trước câu hỏi nhé!
          </p>
          <p className="text-center text-sm text-gray-500">
            Xem Blog hướng dẫn chi tiết :{' '}
            <a href="#" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium hover:underline">
              <ExternalLink className="w-3.5 h-3.5" /> Xem ngay
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}
