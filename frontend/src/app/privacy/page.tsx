import React from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  Trash2, 
  UserCheck, 
  Server, 
  Mail, 
  ArrowLeft, 
  CheckCircle2,
  Clock,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Chính sách bảo mật | OpenQuiz",
  description: "Chính sách bảo vệ dữ liệu cá nhân và quyền riêng tư của OpenQuiz theo Nghị định 13/2023/NĐ-CP.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              OQ
            </div>
            <span className="font-extrabold text-xl tracking-tight">
              Open<span className="text-primary">Quiz</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
              Điều khoản sử dụng
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs sm:text-sm">
                <ArrowLeft className="w-4 h-4" />
                Quay lại đăng nhập
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <div className="border-b border-border/40 bg-gradient-to-b from-blue-500/5 via-transparent to-transparent py-12 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Tuân thủ Nghị định 13/2023/NĐ-CP & Bảo mật dữ liệu
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Chính sách bảo mật
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
            Cam kết minh bạch về cách OpenQuiz thu thập, xử lý và bảo vệ dữ liệu cá nhân của bạn.
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Có hiệu lực từ: Tháng 10/2026
            </span>
            <span>•</span>
            <span>Phiên bản: 1.0 (Bảo vệ người dùng)</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
        
        {/* Cam kết cốt lõi */}
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-3.5 text-emerald-950 dark:text-emerald-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm leading-relaxed space-y-1">
            <p className="font-bold">Cam kết vàng về quyền riêng tư:</p>
            <p className="text-foreground/80">
              OpenQuiz là dự án phi lợi nhuận. Chúng tôi <strong>KHÔNG BAO GIỜ</strong> bán, cho thuê, thương mại hóa hoặc cung cấp dữ liệu cá nhân của bạn cho bất kỳ đơn vị quảng cáo hay bên thứ ba nào vì mục đích sinh lời.
            </p>
          </div>
        </div>

        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary text-sm font-extrabold">1</span>
            Dữ liệu cá nhân chúng tôi thu thập
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2.5 pl-9">
            <p>Để vận hành các tính năng học tập, hệ thống chỉ thu thập các thông tin tối thiểu cần thiết:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-foreground/85">
              <li>
                <strong>Thông tin tài khoản cơ bản:</strong> Họ tên hiển thị, địa chỉ Email và Mật khẩu (mật khẩu luôn được mã hóa 1 chiều bằng thuật toán băm Bcrypt an toàn trước khi lưu vào cơ sở dữ liệu).
              </li>
              <li>
                <strong>Thông tin đăng nhập qua Google (tùy chọn):</strong> Nếu bạn chọn đăng nhập nhanh bằng Google OAuth, hệ thống nhận Email, Tên và Ảnh đại diện công khai từ Google.
              </li>
              <li>
                <strong>Mã sinh viên (tùy chọn):</strong> Được sử dụng để phục vụ tiện ích tự động tra cứu lịch thi và đề xuất bộ đề ôn thi tương ứng. Bạn hoàn toàn có thể để trống hoặc xóa MSV bất kỳ lúc nào.
              </li>
              <li>
                <strong>Dữ liệu học tập & tiến độ:</strong> Điểm số các bài luyện tập trên trang, thời gian làm bài, danh sách câu hỏi bạn lưu vào sổ tay cá nhân.
              </li>
            </ul>
          </div>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary text-sm font-extrabold">2</span>
            Mục đích thu thập & Xử lý dữ liệu
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2 pl-9">
            <p>Dữ liệu được thu thập hoàn toàn nhằm phục vụ trải nghiệm học tập của bạn:</p>
            <ul className="list-disc pl-5 space-y-1 text-foreground/85">
              <li>Xác thực danh tính người dùng và bảo đảm an toàn khi đăng nhập hệ thống.</li>
              <li>Lưu lại lịch sử làm bài thi để bạn theo dõi tiến bộ học tập qua thời gian.</li>
              <li>Hiển thị bảng xếp hạng thành tích học tập (chỉ hiển thị tên và avatar của bạn).</li>
              <li>Cá nhân hóa việc đề xuất các bộ đề ôn tập phù hợp với các môn thi sắp tới của bạn.</li>
              <li>Gửi thông báo liên quan đến tài khoản hoặc cập nhật tính năng mới trên nền tảng.</li>
            </ul>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary text-sm font-extrabold">3</span>
            Biện pháp bảo đảm an toàn kỹ thuật
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2.5 pl-9">
            <p>Chúng tôi triển khai các tiêu chuẩn bảo mật hiện đại để bảo vệ thông tin người dùng:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-card border border-border space-y-1">
                <div className="flex items-center gap-2 font-semibold text-foreground text-xs">
                  <Lock className="w-4 h-4 text-emerald-500" /> Mã hóa mật khẩu
                </div>
                <p className="text-xs text-muted-foreground">
                  Mật khẩu được băm một chiều bằng chuẩn Bcrypt. Ngay cả quản trị viên máy chủ cũng không thể xem được mật khẩu của bạn.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-card border border-border space-y-1">
                <div className="flex items-center gap-2 font-semibold text-foreground text-xs">
                  <Server className="w-4 h-4 text-blue-500" /> Kết nối HTTPS/TLS
                </div>
                <p className="text-xs text-muted-foreground">
                  Toàn bộ dữ liệu truyền tải giữa trình duyệt của bạn và máy chủ được mã hóa an toàn qua giao thức HTTPS.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary text-sm font-extrabold">4</span>
            Quyền của người dùng đối với dữ liệu cá nhân
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2.5 pl-9">
            <p>
              Căn cứ theo <strong>Nghị định 13/2023/NĐ-CP</strong> và các tiêu chuẩn bảo vệ dữ liệu tiên tiến (GDPR), bạn có toàn quyền:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-foreground/85">
              <li>
                <strong>Quyền truy cập & chỉnh sửa:</strong> Bạn có thể xem và chỉnh sửa thông tin cá nhân (tên, avatar, mã sinh viên) bất kỳ lúc nào tại trang Cài đặt.
              </li>
              <li>
                <strong>Quyền yêu cầu xóa bỏ (Right to be forgotten):</strong> Bạn có quyền yêu cầu xóa vĩnh viễn tài khoản và toàn bộ lịch sử thi, dữ liệu cá nhân khỏi hệ thống. Khi tài khoản bị xóa, dữ liệu sẽ không thể khôi phục.
              </li>
              <li>
                <strong>Quyền rút lại sự đồng ý:</strong> Bạn có thể ngừng sử dụng dịch vụ hoặc hủy liên kết tài khoản Google bất kỳ lúc nào.
              </li>
            </ul>
          </div>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary text-sm font-extrabold">5</span>
            Cookies & Bộ nhớ cục bộ (LocalStorage)
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2 pl-9">
            <p>
              OpenQuiz sử dụng LocalStorage và Cookies chỉ nhằm mục đích kỹ thuật: lưu trạng thái đăng nhập (Auth Token) và ghi nhớ các cài đặt giao diện (chế độ sáng/tối, thiết lập font chữ). Chúng tôi không sử dụng Cookie theo dõi của bên thứ ba để quảng cáo.
            </p>
          </div>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary text-sm font-extrabold">6</span>
            Kênh liên hệ tiếp nhận yêu cầu về dữ liệu
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 pl-9">
            <p>
              Mọi yêu cầu liên quan đến việc trích xuất dữ liệu, chỉnh sửa thông tin hoặc xóa tài khoản vĩnh viễn, xin vui lòng gửi email tới bộ phận quản trị:
            </p>
            <div className="p-4 rounded-xl bg-card border border-border flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div className="text-xs sm:text-sm">
                <p className="font-bold text-foreground">Email Bảo mật & Hỗ trợ:</p>
                <p className="font-mono text-primary font-medium">contact.openquiz@gmail.com</p>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA / Links */}
        <div className="pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            Xem thêm{" "}
            <Link href="/terms" className="text-primary hover:underline font-semibold">
              Điều khoản sử dụng
            </Link>{" "}
            để hiểu rõ quy định của cộng đồng.
          </p>
          <Link href="/register">
            <Button size="sm" className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Tiếp tục Đăng ký
            </Button>
          </Link>
        </div>

      </main>
    </div>
  );
}
