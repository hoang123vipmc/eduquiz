<h1 align="center">OpenQuiz</h1>

<p align="center">
  <strong>Nền tảng luyện thi trắc nghiệm phi lợi nhuận dành cho sinh viên Việt Nam</strong><br/>
  <em>Open-source quiz platform for Vietnamese university students</em>
</p>

<p align="center">
  <a href="https://openquiz-free.vercel.app">
    <img src="https://img.shields.io/badge/Live%20Demo-openquiz--free.vercel.app-0b57d0?style=for-the-badge&logo=vercel" alt="Live Demo" />
  </a>
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/Laravel-11-FF2D20?style=for-the-badge&logo=laravel" alt="Laravel 11" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript 5" />
</p>

---

## ✨ Tính năng nổi bật

| Tính năng | Mô tả |
|---|---|
| 📄 **Import thông minh** | Tải lên file `.docx` hoặc dán văn bản — tự động phân tích câu hỏi trắc nghiệm tiếng Việt |
| 🎯 **Chế độ Luyện tập** | Phản hồi tức thì sau mỗi câu, xem giải thích chi tiết, làm lại câu sai |
| ⏱️ **Chế độ Thi** | Đếm ngược thời gian, ẩn đáp án cho đến khi nộp bài — mô phỏng kỳ thi thực tế |
| 📊 **Phân tích kết quả** | Điểm số, biểu đồ, lọc câu đúng/sai/bỏ qua, xem lại từng câu |
| 🤖 **AI hỗ trợ** | Giải thích đáp án bằng Gemini AI tích hợp ngay trong giao diện làm bài |
| 🏆 **Bảng xếp hạng** | So sánh độ chính xác, thời gian học, streak ngày học với cộng đồng |
| 📅 **Lịch thi HUBT** | Tra cứu lịch thi chính thức từ nhiều nguồn trực tiếp trong ứng dụng |
| 🌙 **Dark / Light Mode** | Giao diện thích ứng ánh sáng môi trường, hỗ trợ cả mobile và desktop |

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** — App Router, Turbopack, React Server Components
- **React 19** + **TypeScript 5** (Strict Mode)
- **Tailwind CSS v4** — CSS Variables, `@theme` tokens
- **Zustand 5** — Global auth & UI state management
- **Recharts** — Data visualization for statistics

### Backend
- **Laravel 11** (PHP 8.2+) — RESTful API
- **Laravel Sanctum** — Bearer token authentication
- **Laravel Socialite** — Google OAuth 2.0
- **MySQL / PostgreSQL / SQLite** — Flexible DB support

### Deployment
- **Frontend** → [Vercel](https://openquiz-free.vercel.app)
- **Backend** → Render (Dockerized)

---

## 🚀 Chạy locally

### Yêu cầu
- Node.js >= 18, npm >= 9
- PHP >= 8.2, Composer
- MySQL / PostgreSQL hoặc SQLite

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # Điền NEXT_PUBLIC_API_URL
npm run dev
```

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

---

## 📁 Cấu trúc dự án

```
/
├── frontend/          # Next.js 15 App Router
│   ├── src/
│   │   ├── app/       # Pages & layouts (App Router)
│   │   ├── components/ # UI components (quiz, layout, ui)
│   │   ├── store/     # Zustand stores
│   │   └── lib/       # Utils & API client
│   └── public/        # Static assets
│
├── backend/           # Laravel 11 REST API
│   ├── app/
│   │   ├── Http/Controllers/
│   │   ├── Http/Middleware/
│   │   └── Models/
│   └── routes/api.php
│
└── scripts/           # Utility & data extraction scripts
```

---

## 🔐 Bảo mật

- Xác thực bằng **Laravel Sanctum** Bearer Token
- Đăng nhập Google OAuth — mật khẩu do Google quản lý hoàn toàn
- Rate limiting chống brute-force trên endpoint đăng nhập
- CSP headers, XSS protection, upload validation phía server
- File upload giới hạn: chỉ cho phép ảnh `.jpg/.png/.webp`

---

## 🤝 Đóng góp

Dự án mở — mọi đóng góp đều được hoan nghênh!

1. Fork repo
2. Tạo branch: `git checkout -b feature/ten-tinh-nang`
3. Commit: `git commit -m "feat: mo ta ngan"`
4. Push & tạo Pull Request

---

## 📬 Liên hệ & Hỗ trợ

- 🌐 Website: [openquiz-free.vercel.app](https://openquiz-free.vercel.app)
- 💬 Báo lỗi: [GitHub Issues](https://github.com/hoang123vipmc/eduquiz/issues)

---

<p align="center"><em>Học tập phi lợi nhuận — Tất cả vì người học 🎓</em></p>
