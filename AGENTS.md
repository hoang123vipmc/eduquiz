# 🤖 OpenQuiz — Agent & Developer Guidelines (AGENTS.md)

Tài liệu này định nghĩa các nguyên tắc phát triển lâu dài dành cho tất cả AI Agent và lập trình viên làm việc trên codebase **OpenQuiz**. Mọi thay đổi đều phải tuân thủ nghiêm ngặt các nguyên tắc dưới đây.

---

## 1. Bảo Toàn Business Logic & Luồng Dữ Liệu
- **Bảo toàn API Contract:** Giữ nguyên cấu trúc request/response của các API hiện tại (Backend Laravel `/api/v1/...` và Next.js serverless routes `/api/...`).
- **Bảo toàn Xác thực (Auth Flow):** Giữ nguyên cơ chế xác thực qua Laravel Sanctum (Bearer Token trong `localStorage`), Google OAuth và Zustand store (`src/store/authStore.ts`).
- **Dữ liệu thật là cốt lõi:** Tuyệt đối **KHÔNG** thay thế dữ liệu thật bằng dữ liệu mẫu (mock/hardcoded data). Không tự ý xóa bỏ, rút gọn hoặc thay đổi luồng nghiệp vụ hiện có (làm bài thi, tính điểm, lịch sử, bookmark, xếp hạng, tra cứu lịch thi HUBT đa nguồn).

---

## 2. Chuẩn Tech Stack & Phiên Bản
Dự án được xây dựng trên stack hiện đại, luôn viết mã tương thích chính xác với các phiên bản trong source code:
- **Frontend (`/frontend`):**
  - Next.js 15.5+ (App Router, Turbopack)
  - React 19 & TypeScript 5 (Strict Mode)
  - Tailwind CSS v4 (`@tailwindcss/postcss`, khai báo `@theme` trong `globals.css`)
  - Lucide React (icon SVG đồng bộ)
  - Zustand 5 (quản lý state client)
  - Recharts (trực quan hóa dữ liệu thống kê)
- **Backend (`/backend`):**
  - Laravel 11.x (PHP 8.2+)
  - Laravel Sanctum (Authentication)
  - MySQL / PostgreSQL / SQLite

---

## 3. Design System OpenQuiz (Google Workspace / Material 3)
Giao diện tuân thủ phong cách **Google Drive / Google Workspace** tối giản, thanh lịch, tập trung cho học tập:
- **Bảng màu chủ đạo (CSS Tokens trong `globals.css`):**
  - Canvas nền ứng dụng: Trắng băng dịu mắt `--background: #f8fafd` (Light) / `#131314` (Dark).
  - Mặt thẻ nội dung: Trắng tinh khiết `--card: #ffffff` (Light) / `#1e1f20` (Dark).
  - Màu thương hiệu chính: Xanh Google Drive `--primary: #0b57d0` / chữ trắng.
  - Vùng chọn / Highlight: `--accent: #c2e7ff` / chữ `--accent-foreground: #001d35`.
  - Đường viền mờ tinh tế: `--border: #e0e2ec`.
- **Nhận diện thành phần:**
  - Nút hành động chính (`+ Mới / Tạo đề thi`) và thanh tìm kiếm đều dùng dạng viên thuốc bo tròn hoàn toàn (`rounded-full`).
  - Khung làm việc nổi: Toàn bộ nội dung trang nằm trong thẻ nền trắng bo góc lớn (`rounded-2xl bg-card border border-border/80 shadow-2xs`).
  - Tránh dùng các mảng màu tím đậm/gradient lòe loẹt gây mỏi mắt cho người học.

---

## 4. Tái Sử Dụng Component Hiện Có
Ưu tiên tái sử dụng các component có sẵn thay vì viết lại từ đầu:
- **Layout:** `Sidebar.tsx`, `Topbar.tsx`, `NotificationDropdown.tsx` trong `src/components/layout/`.
- **Modals & Quizzes:** `QuizSettingsModal.tsx`, `ImportQuizModal.tsx`, `PrintQuizModal.tsx`, `EditQuizModal.tsx`, `AskAIModal.tsx`, `FormatGuideModal.tsx` trong `src/components/quiz/`.
- **Base UI:** `button.tsx`, `card.tsx`, `input.tsx` trong `src/components/ui/`.
- **Utils:** Sử dụng hàm `cn()` trong `src/lib/utils.ts` để nối class Tailwind CSS an toàn.

---

## 5. Responsive, Accessibility & Themes
- **Responsive 100%:** Giao diện phải hoạt động mượt mà trên cả Mobile, Tablet và Desktop. Giữ nguyên Mobile bottom navigation bar và drawer menu.
- **Accessibility (a11y):** Luôn có `aria-label` cho nút chỉ có icon, phân cấp heading hợp lý (`h1`, `h2`, `h3`), tương phản văn bản cao, hỗ trợ điều hướng bàn phím.
- **Hỗ trợ Theme:** Giữ tính tương thích với cả Light Mode và Dark Mode thông qua CSS variables.

---

## 6. Quy Trình Kiểm Thử & Nghiệm Thu
Trước khi báo cáo hoàn thành bất kỳ nhiệm vụ nào:
1. **Kiểm tra kiểu dữ liệu:** Chạy `npx tsc --noEmit` tại thư mục `frontend/` để đảm bảo 0 lỗi TypeScript.
2. **Kiểm tra Build:** Đảm bảo `npm run build` biên dịch thành công tất cả các routes.
3. **Kiểm tra hồi quy:** Đảm bảo các tính năng liên quan không bị ảnh hưởng tiêu cực bởi thay đổi mới.
