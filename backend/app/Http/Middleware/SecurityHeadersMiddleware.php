<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Thêm các HTTP Security Headers vào tất cả phản hồi API
 * để chống lại các tấn công phổ biến: Clickjacking, MIME Sniffing, XSS, v.v.
 */
class SecurityHeadersMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Ngăn trình duyệt nhúng trang web vào iframe (chống Clickjacking)
        $response->headers->set('X-Frame-Options', 'DENY');

        // Ngăn trình duyệt đoán sai MIME type (chống MIME Sniffing)
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // Bật bộ lọc XSS của trình duyệt
        $response->headers->set('X-XSS-Protection', '1; mode=block');

        // Không gửi Referrer header khi điều hướng sang domain khác (bảo vệ privacy URL)
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Bắt buộc HTTPS cho 1 năm (chỉ có hiệu lực khi deploy lên production HTTPS)
        $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

        // Vô hiệu hoá các tính năng browser có rủi ro bảo mật
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

        // Xóa thông tin Server để kẻ tấn công không biết được phiên bản phần mềm
        $response->headers->remove('X-Powered-By');
        $response->headers->remove('Server');

        return $response;
    }
}
