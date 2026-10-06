import React from "react";
import Link from "next/link";
import { 
  Scale, 
  ShieldCheck, 
  FileText, 
  AlertTriangle, 
  HelpCircle, 
  ArrowLeft, 
  Mail, 
  CheckCircle2,
  Clock,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Điều khoản sử dụng | OpenQuiz",
  description: "Điều khoản và quy định sử dụng nền tảng ôn thi trắc nghiệm OpenQuiz.",
};

export default function TermsPage() {
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
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
              Chính sách bảo mật
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
      <div className="border-b border-border/40 bg-gradient-to-b from-primary/5 via-transparent to-transparent py-12 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-2">
            <Scale className="w-3.5 h-3.5" />
            Văn bản pháp lý & Điều khoản dịch vụ
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Điều khoản sử dụng
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
            Quy định về việc sử dụng nền tảng ôn thi trắc nghiệm mở OpenQuiz. Vui lòng đọc kỹ trước khi đăng ký hoặc sử dụng dịch vụ.
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Có hiệu lực từ: Tháng 10/2026
            </span>
            <span>•</span>
            <span>Phiên bản: 1.0 (Phi lợi nhuận)</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
        
        {/* Banner Tóm tắt nhanh */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3.5 text-amber-900 dark:text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm leading-relaxed space-y-1">
            <p className="font-bold">Tóm tắt ngắn gọn:</p>
            <p className="text-muted-foreground text-foreground/80">
              OpenQuiz là dự án cá nhân phi lợi nhuận phục vụ học tập. Bạn tự chịu trách nhiệm về tài liệu ôn tập bạn tải lên. Nghiêm cấm tải lên đề thi có tính bảo mật hoặc gian lận trong thi cử. Chúng tôi tôn trọng quyền sở hữu trí tuệ và cam kết gỡ bỏ nội dung ngay khi có yêu cầu hợp lệ từ tác giả hoặc nhà trường.
            </p>
          </div>
        </div>

        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary text-sm font-extrabold">1</span>
            Giới thiệu & Bản chất dịch vụ
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2.5 pl-9">
            <p>
              <strong>OpenQuiz</strong> là nền tảng luyện thi trắc nghiệm trực tuyến được phát triển độc lập như một dự án công nghệ phục vụ cộng đồng học sinh, sinh viên và nghiên cứu học thuật phi lợi nhuận.
            </p>
            <p>
              Bằng việc truy cập trang web, tạo tài khoản hoặc sử dụng bất kỳ tính năng nào, bạn xác nhận rằng bạn đã đủ độ tuổi theo luật định, đã đọc, hiểu và đồng ý chịu sự ràng buộc của Điều khoản sử dụng này. Nếu không đồng ý, vui lòng ngừng sử dụng dịch vụ.
            </p>
          </div>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary text-sm font-extrabold">2</span>
            Tài khoản & Trách nhiệm người dùng
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2.5 pl-9">
            <p>
              Khi đăng ký tài khoản tại OpenQuiz, bạn cam kết cung cấp thông tin chính xác và có trách nhiệm tự bảo mật mật khẩu của mình. Mọi hành vi thực hiện dưới tài khoản của bạn sẽ thuộc trách nhiệm của chính bạn.
            </p>
            <p className="font-semibold text-foreground">Người dùng cam kết TUYỆT ĐỐI KHÔNG thực hiện các hành vi sau:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-foreground/85">
              <li>Sử dụng OpenQuiz để gian lận, sao chép hoặc hỗ trợ thi cử trong phòng thi chính thức vi phạm quy chế thi của Bộ GD&ĐT hoặc nhà trường.</li>
              <li>Tải lên, chia sẻ các tài liệu vi phạm pháp luật Việt Nam (nội dung kích động bạo lực, phản động, đồi trụy, vi phạm thuần phong mỹ tục hoặc bôi nhọ danh dự người khác).</li>
              <li>Thực hiện các hành vi tấn công từ chối dịch vụ (DDoS), phát tán virus, khai thác lỗ hổng hoặc can thiệp trái phép vào hệ thống máy chủ của OpenQuiz.</li>
              <li>Sử dụng công cụ tự động (bot, scraper) để thu thập dữ liệu hàng loạt từ OpenQuiz với mục đích thương mại khi chưa có sự cho phép bằng văn bản.</li>
            </ul>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary text-sm font-extrabold">3</span>
            Quyền sở hữu trí tuệ & Nội dung do người dùng tải lên (UGC)
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2.5 pl-9">
            <p>
              OpenQuiz cung cấp công cụ tạo và ôn luyện đề thi. Đa số các câu hỏi, bộ đề thi trên nền tảng do người dùng và cộng đồng sinh viên tự tải lên hoặc biên soạn nhằm mục đích chia sẻ học tập lẫn nhau.
            </p>
            <p>
              <strong>Trách nhiệm về bản quyền:</strong> Người dùng tải lên bộ đề tự chịu trách nhiệm hoàn toàn về quyền tác giả và nguồn gốc tài liệu mình đưa lên. Nghiêm cấm tải lên các bộ đề thi nội bộ có cam kết bảo mật, tài liệu thuộc diện "Bí mật nhà nước" hoặc ngân hàng câu hỏi bị nghiêm cấm phát tán ra ngoài bởi cơ quan chủ quản.
            </p>
            <p>
              OpenQuiz <strong>không tuyên bố quyền sở hữu</strong> đối với các câu hỏi học thuật thuộc chương trình đào tạo của các cơ sở giáo dục hoặc nhà xuất bản. Giao diện, mã nguồn và thương hiệu OpenQuiz thuộc quyền quản trị của nhóm phát triển dự án.
            </p>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary text-sm font-extrabold">4</span>
            Chính sách gỡ bỏ nội dung vi phạm (Notice & Takedown / DMCA)
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 pl-9">
            <p>
              Chúng tôi tôn trọng quyền sở hữu trí tuệ của tất cả các tổ chức, trường học, giảng viên và tác giả. Chúng tôi tuân thủ nguyên tắc xử lý khiếu nại bản quyền theo thông lệ quốc tế và Luật Sở hữu trí tuệ Việt Nam.
            </p>
            <div className="p-4 rounded-xl bg-card border border-border space-y-2">
              <p className="font-semibold text-foreground flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" /> Quy trình tiếp nhận yêu cầu gỡ bỏ:
              </p>
              <p className="text-xs sm:text-sm">
                Nếu bạn là chủ sở hữu quyền tác giả (hoặc đại diện hợp pháp của nhà trường/tác giả) và phát hiện nội dung trên OpenQuiz vi phạm quyền của mình, vui lòng gửi thông báo kèm liên kết bộ đề cần xử lý tới email:
              </p>
              <div className="p-2.5 rounded-lg bg-muted text-foreground font-mono text-xs flex items-center justify-between">
                <span>contact.openquiz@gmail.com</span>
                <span className="text-[11px] text-muted-foreground font-sans">Thời gian xử lý: 24h - 48h</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Sau khi tiếp nhận và xác thực, chúng tôi sẽ ngay lập tức ẩn hoặc xóa bỏ vĩnh viễn nội dung vi phạm khỏi hệ thống.
              </p>
            </div>
          </div>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary text-sm font-extrabold">5</span>
            Tính năng tra cứu lịch thi & Nguồn dữ liệu thứ ba
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2.5 pl-9">
            <p>
              Tính năng tra cứu lịch thi và điểm điều kiện trên OpenQuiz trích xuất từ các cổng tra cứu công khai phục vụ tiện ích quản lý lịch học và nhắc nhở ôn bài cá nhân của sinh viên.
            </p>
            <p>
              OpenQuiz là ứng dụng độc lập, <strong>không phải là ứng dụng chính thức hay đại diện pháp lý</strong> cho bất kỳ trường đại học hay cơ sở giáo dục nào. Sinh viên có trách nhiệm đối chiếu lịch thi với thông báo chính thức được niêm yết bởi Nhà trường và phòng Đào tạo.
            </p>
          </div>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary text-sm font-extrabold">6</span>
            Tuyên bố miễn trừ trách nhiệm (Disclaimer)
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2.5 pl-9">
            <p>
              Nền tảng được cung cấp trên nguyên tắc <em>"nguyên trạng" (As-Is)</em> và <em>"sẵn có"</em>, hoàn toàn miễn phí vì mục đích phi lợi nhuận.
            </p>
            <p>
              Chúng tôi nỗ lực tối đa để đảm bảo hệ thống vận hành ổn định và chính xác. Tuy nhiên, chúng tôi không cam kết rằng dịch vụ sẽ không bao giờ bị gián đoạn hoặc không có lỗi kỹ thuật. Trong mọi trường hợp, OpenQuiz không chịu trách nhiệm đối với bất kỳ khiếu nại, tổn thất hay tranh chấp nào phát sinh từ việc sử dụng thông tin và kết quả luyện tập trên nền tảng.
            </p>
          </div>
        </section>

        {/* Section 7 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary text-sm font-extrabold">7</span>
            Thay đổi điều khoản & Chấm dứt dịch vụ
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2.5 pl-9">
            <p>
              Chúng tôi có quyền sửa đổi hoặc cập nhật Điều khoản sử dụng này bất cứ lúc nào để phù hợp với quy định của pháp luật và sự phát triển của hệ thống. Các thay đổi sẽ có hiệu lực ngay khi được đăng tải trên trang này.
            </p>
            <p>
              Chúng tôi cũng có quyền tạm ngừng hoặc khóa tài khoản của bất kỳ người dùng nào có hành vi vi phạm nghiêm trọng các điều khoản nêu trên mà không cần thông báo trước.
            </p>
          </div>
        </section>

        {/* Bottom CTA / Links */}
        <div className="pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            Bạn có câu hỏi về Điều khoản sử dụng? Hãy đọc thêm{" "}
            <Link href="/privacy" className="text-primary hover:underline font-semibold">
              Chính sách bảo mật
            </Link>.
          </p>
          <Link href="/register">
            <Button size="sm" className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Tôi đồng ý & Đăng ký
            </Button>
          </Link>
        </div>

      </main>
    </div>
  );
}
