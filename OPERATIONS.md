# EduQuiz — Operations & Configuration Guide (Sổ Tay Quản Trị & Vận Hành)

> **Mục đích tài liệu:** Hướng dẫn tập trung nơi lưu trữ, quản lý cấu hình, biến môi trường, bảo mật Subdomain, DNS và quy trình vận hành dự án EduQuiz.
> 
> ⚠️ **NGUYÊN TẮC VÀNG:** Tuyệt đối **KHÔNG** lưu mật khẩu thật, APP_KEY hoặc API Secret vào file này hoặc commit lên GitHub.

---

## 1. Nơi Quản Lý Các Loại Thông Tin Trong Dự Án

Một dự án web hiện đại (Frontend Next.js + Backend Laravel API) chia thông tin thành 4 tầng quản lý riêng biệt:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           1. DOMAIN & DNS                               │
│  (Quản lý tại: Cloudflare / Nhà cung cấp Domain - Matbao, PA, Namecheap)│
│  - Phân giải tên miền chính: eduquiz.vn                                 │
│  - Phân giải subdomain API: api.eduquiz.vn                              │
│  - Cấu hình SSL/TLS (HTTPS), WAF chống DDoS                             │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
             ┌───────────────────────┴───────────────────────┐
             ▼                                               ▼
┌──────────────────────────────┐        ┌──────────────────────────────┐
│     2. FRONTEND (Vercel)     │        │     3. BACKEND (Render)      │
│  (Quản lý tại Vercel Settings)│       │ (Quản lý tại Render Settings)│
│  - Quản lý Domains / SSL     │        │  - Environment Variables     │
│  - Environment Variables:    │        │  - Docker build & port       │
│    `NEXT_PUBLIC_API_URL`     │        │  - Secrets: APP_KEY, DB pass │
└──────────────────────────────┘        └──────────────┬───────────────┘
                                                       │
                                                       ▼
                                        ┌──────────────────────────────┐
                                        │    4. DATABASE & STORAGE     │
                                        │  (Postgres trên Render/Neon) │
                                        │  - Connection string         │
                                        │  - Automated Backups         │
                                        └──────────────────────────────┘
```

### Bảng tóm tắt nơi cấu hình từng mục:

| Loại thông tin | Nơi quản lý (Môi trường Dev) | Nơi quản lý (Môi trường Production) | Ai có quyền truy cập? |
|---|---|---|---|
| **Mã nguồn (Codebase)** | Git local & VS Code / Cursor | GitHub (`hoang123vipmc/eduquiz`) | Thành viên dev / Admin repo |
| **Domain & Subdomain** | `localhost:3000` & `localhost:8000` | Trang quản trị DNS (Khuyên dùng Cloudflare) | Chủ sở hữu domain |
| **Biến môi trường Frontend** | `frontend/.env.local` | **Vercel Dashboard** -> Project -> Settings -> Environment Variables | Quản trị viên Vercel |
| **Biến môi trường Backend** | `backend/.env` | **Render Dashboard** -> Web Service -> Environment -> Environment Variables | Quản trị viên Render |
| **Thông tin Database** | `backend/.env` (DB_*) | Render Dashboard (Internal/External Database URL) | Quản trị viên Render / Backend |
| **Tài liệu hướng dẫn này** | `OPERATIONS.md` trong repo | `OPERATIONS.md` trong repo | Đội ngũ phát triển |

---

## 2. Quản Lý Tên Miền & Subdomain (DNS Matrix)

Khi bạn mua một tên miền (Ví dụ: `eduquiz.vn`), bạn sẽ cấu hình bảng DNS như sau tại trang quản trị DNS (khuyên dùng **Cloudflare** để có sẵn SSL miễn phí và tính năng chống DDoS):

### Bảng cấu hình DNS chuẩn cho EduQuiz:

| Bản ghi (Type) | Tên (Host / Name) | Giá trị (Value / Target) | Mục đích |
|---|---|---|---|
| **CNAME** | `@` hoặc `eduquiz.vn` | `cname.vercel-dns.com` | Trỏ web chính (Frontend Next.js) về Vercel |
| **CNAME** | `www` | `cname.vercel-dns.com` | Cho phép truy cập qua `www.eduquiz.vn` |
| **CNAME** | `api` | `<tên-service-render>.onrender.com` | Trỏ subdomain `api.eduquiz.vn` về Backend Laravel trên Render |
| **TXT** | `@` | `v=spf1 include:... ~all` | (Tùy chọn) Xác thực gửi email nếu có cấu hình Mail |

> 🔒 **Cảnh báo an toàn Subdomain (Chống Subdomain Takeover):**
> Khi bạn ngừng dùng hoặc xóa backend trên Render, **PHẢI XÓA NGAY bản ghi CNAME `api` trên DNS**. Nếu không, người khác có thể đăng ký đúng tên service đó trên Render và chiếm đoạt luồng gọi API của bạn.

---

## 3. Ma Trận Biến Môi Trường (Environment Variables Matrix)

### A. Frontend (Next.js)

Quản lý tại file `frontend/.env.local` (khi dev) và **Vercel Settings** (khi chạy production):

| Tên biến | Giá trị mẫu (Dev) | Giá trị mẫu (Production) | Ghi chú |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api/v1` | `https://api.eduquiz.vn/api/v1` (hoặc URL Render) | Bắt buộc phải có `NEXT_PUBLIC_` để trình duyệt đọc được |

### B. Backend (Laravel 11)

Quản lý tại file `backend/.env` (khi dev) và **Render Settings** (khi chạy production):

| Tên biến | Giá trị mẫu (Dev) | Giá trị mẫu (Production) | Ghi chú bảo mật quan trọng |
|---|---|---|---|
| `APP_NAME` | `EduQuiz` | `EduQuiz` | Tên hiển thị hệ thống |
| `APP_ENV` | `local` | `production` | Production sẽ tắt thông tin lỗi chi tiết |
| `APP_KEY` | *(Tạo qua `php artisan key:generate`)* | *(Tạo chuỗi base64 ngẫu nhiên)* | **Bảo mật tuyệt đối**, không để lộ |
| `APP_DEBUG` | `true` | `false` | **BẮT BUỘC là false trên Production** để không lộ stack trace |
| `APP_URL` | `http://localhost:8000` | `https://api.eduquiz.vn` | URL gốc của backend |
| `FRONTEND_URL` | `http://localhost:3000` | `https://eduquiz.vn` | Dùng để cấp phép CORS và chuyển hướng |
| `SANCTUM_STATEFUL_DOMAINS` | `localhost:3000` | `eduquiz.vn,www.eduquiz.vn` | Domain được phép xác thực session (nếu dùng cookie) |
| `DB_CONNECTION` | `sqlite` hoặc `pgsql` | `pgsql` | PostgreSQL trên Render |
| `DATABASE_URL` | *(None)* | *(Render tự sinh khi attach DB)* | Chuỗi kết nối PostgreSQL bảo mật |
| `SESSION_DRIVER` | `database` hoặc `file` | `database` hoặc `cookie` | Lưu session |
| `SESSION_SECURE_COOKIE` | `false` | `true` | Chỉ gửi cookie qua HTTPS khi trên Production |
| `GOOGLE_CLIENT_ID` | *(Client ID từ Google)* | *(Client ID từ Google)* | ID ứng dụng Google OAuth 2.0 |
| `GOOGLE_CLIENT_SECRET` | *(Client Secret)* | *(Client Secret)* | Khóa bí mật Google OAuth 2.0 |
| `GOOGLE_REDIRECT_URI` | `http://localhost:8000/api/v1/auth/callback/google` | `https://<tên-service>.onrender.com/api/v1/auth/callback/google` | URL nhận kết quả xác thực từ Google |

---

## 4. Các Biện Pháp Bảo Mật Đã Triển Khai Trong Mã Nguồn

Dự án EduQuiz đã được tích hợp sẵn các lớp bảo vệ:

1. **Security Headers (`SecurityHeadersMiddleware.php`):**
   - `X-Content-Type-Options: nosniff`: Chống MIME-sniffing.
   - `X-Frame-Options: SAMEORIGIN`: Chống tấn công Clickjacking.
   - `Strict-Transport-Security (HSTS)`: Ép trình duyệt luôn dùng kết nối HTTPS bảo mật (kèm `includeSubDomains`).
   - `Referrer-Policy: strict-origin-when-cross-origin`: Bảo vệ rò rỉ URL nhạy cảm.
   - `Permissions-Policy`: Vô hiệu hóa microphone, camera, geolocation không mong muốn.

2. **Kiểm tra File Upload chặt chẽ (`UploadController.php`):**
   - Xác thực đuôi mở rộng (`jpg, jpeg, png, webp, docx, txt`).
   - Xác thực cả **MIME type thực tế** của file (không tin tưởng tên file do client gửi).
   - Kiểm tra kích thước file tối đa (2MB cho ảnh, 5MB cho tài liệu).

3. **CORS chặt chẽ (`config/cors.php`):**
   - Chỉ cho phép `FRONTEND_URL` và domain dự án gọi API.
   - Không dùng `*` wildcard bừa bãi.

4. **Chống Brute-force & Rate Limiting (`routes/api.php`):**
   - Đăng nhập: giới hạn `5 requests/phút` theo IP/email.
   - Đăng ký: giới hạn `5 requests/phút`.
   - Upload & Quiz Ingestion: giới hạn `10 requests/phút`.
   - API thông thường: giới hạn `60 requests/phút`.

5. **Chống Race Condition khi tạo tài khoản & nộp bài:**
   - Unique constraints trên Database.
   - Database Transactions (`DB::transaction`) khi xử lý điểm số và bài thi.

---

## 5. Quy Trình Vận Hành Thường Nhật (SOP - Standard Operating Procedures)

### Quy trình 1: Cập nhật biến môi trường trên Production
1. Truy cập trang quản trị (Vercel cho frontend, Render cho backend).
2. Vào tab **Settings** -> **Environment Variables**.
3. Thêm hoặc sửa biến cần thiết.
4. **Trigger Redeploy** lại ứng dụng để biến mới có hiệu lực.

### Quy trình 2: Gắn tên miền mới (Ví dụ: `eduquiz.vn`)
1. **Mua tên miền** tại nhà cung cấp (Namecheap, Cloudflare, TENTEN, PA,...).
2. Trỏ NameServers của tên miền về Cloudflare (Khuyên dùng).
3. Tại **Vercel**:
   - Vào project -> Settings -> Domains -> Thêm `eduquiz.vn` và `www.eduquiz.vn`.
   - Vercel sẽ hiển thị bản ghi DNS cần cấu hình.
4. Tại **Render**:
   - Vào Web Service backend -> Settings -> Custom Domains -> Thêm `api.eduquiz.vn`.
   - Render sẽ hiển thị bản ghi CNAME cần cấu hình.
5. Cập nhật DNS trên Cloudflare:
   - `@` -> CNAME Vercel
   - `api` -> CNAME Render
6. Cập nhật biến môi trường:
   - Trên Vercel: `NEXT_PUBLIC_API_URL=https://api.eduquiz.vn/api/v1`
   - Trên Render: `FRONTEND_URL=https://eduquiz.vn`, `APP_URL=https://api.eduquiz.vn`
7. Redeploy cả 2 bên và kiểm tra kết nối.

### Quy trình 3: Kiểm tra Logs và Giám sát sức khỏe hệ thống
- **Frontend Logs:** Truy cập Vercel Dashboard -> Tab `Logs` (theo dõi lỗi 404, 500 từ Next.js).
- **Backend Logs:** Truy cập Render Dashboard -> Tab `Logs` (theo dõi exception Laravel).
- **Tải Database:** Theo dõi dung lượng và kết nối tại dashboard cơ sở dữ liệu trên Render.
