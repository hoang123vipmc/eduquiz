<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    // ── Danh sách MIME type thực sự được phép (kiểm tra bằng magic bytes, không tin Content-Type từ client) ──
    private const ALLOWED_MIMES = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
    ];

    public function uploadImage(Request $request)
    {
        $request->validate([
            'image' => 'required|file|max:3072', // 3MB limit
        ]);

        $file = $request->file('image');

        // ── Security: Kiểm tra MIME thực bằng magic bytes, không tin client Content-Type ──
        $realMime = mime_content_type($file->getRealPath());
        if (!in_array($realMime, self::ALLOWED_MIMES)) {
            return response()->json([
                'success' => false,
                'message' => 'File không hợp lệ. Chỉ chấp nhận ảnh JPEG, PNG, WebP hoặc GIF.'
            ], 422);
        }

        // ── Security: Xây dựng tên file an toàn từ entropy ngẫu nhiên - KHÔNG dùng tên gốc từ client ──
        $mimeToExt = [
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp',
            'image/gif'  => 'gif',
        ];
        $extension = $mimeToExt[$realMime] ?? 'jpg';
        $filename = 'img_' . Str::random(24) . '_' . time() . '.' . $extension;

        $destinationPath = public_path('uploads');
        if (!file_exists($destinationPath)) {
            mkdir($destinationPath, 0755, true);
        }

        $file->move($destinationPath, $filename);

        $baseUrl = rtrim(config('app.url'), '/');
        if (str_contains($baseUrl, 'localhost') && $request->getSchemeAndHttpHost()) {
            $baseUrl = $request->getSchemeAndHttpHost();
        }
        $url = $baseUrl . '/uploads/' . $filename;

        return response()->json([
            'success' => true,
            'message' => 'Tải ảnh lên thành công.',
            'url'     => $url,
            'path'    => '/uploads/' . $filename
        ]);
    }
}
