<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Http\Resources\CategoryResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    /**
     * Lấy danh sách danh mục (kèm số lượng đề thi)
     */
    public function index()
    {
        // Tự động khởi tạo các danh mục đại học phổ biến nếu hệ thống chưa có danh mục nào
        if (Category::count() === 0) {
            $defaultCategories = [
                ['name' => 'Triết học & Khoa học chính trị', 'slug' => 'triet-hoc-chinh-tri', 'icon' => 'scale', 'description' => 'Triết học Mác-Lênin, Tư tưởng HCM, CNXHKH, Lịch sử Đảng'],
                ['name' => 'Công nghệ thông tin', 'slug' => 'cong-nghe-thong-tin', 'icon' => 'laptop', 'description' => 'Lập trình, Cơ sở dữ liệu, Mạng máy tính, Mã nguồn mở'],
                ['name' => 'Kinh tế & Quản trị kinh doanh', 'slug' => 'kinh-te-quan-tri', 'icon' => 'trending-up', 'description' => 'Khởi sự kinh doanh, Marketing, Tài chính, Kế toán'],
                ['name' => 'Ngoại ngữ & Tiếng Anh', 'slug' => 'ngoai-ngu', 'icon' => 'globe', 'description' => 'Tiếng Anh chuyên ngành, Tiếng Anh giao tiếp, Ngoại ngữ 2'],
                ['name' => 'Pháp luật đại cương', 'slug' => 'phap-luat-dai-cuong', 'icon' => 'book-marked', 'description' => 'Pháp luật đại cương, Luật kinh tế'],
                ['name' => 'Toán & Khoa học tự nhiên', 'slug' => 'toan-khoa-hoc-tu-nhien', 'icon' => 'calculator', 'description' => 'Toán cao cấp, Xác suất thống kê, Vật lý đại cương'],
            ];
            foreach ($defaultCategories as $cat) {
                Category::firstOrCreate(['slug' => $cat['slug']], $cat);
            }
            Cache::forget('all_categories_list');
        }

        $categories = Cache::remember('all_categories_list', 120, function () {
            return CategoryResource::collection(
                Category::withCount('quizzes')->orderBy('name')->get()
            )->resolve();
        });

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách danh mục thành công.',
            'data' => $categories
        ]);
    }

    /**
     * Tạo danh mục mới hoặc trả về danh mục đã có
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255',
            'icon' => 'nullable|string|max:255',
            'description' => 'nullable|string',
        ]);

        $name = trim($request->name);
        $slug = $request->filled('slug') ? Str::slug($request->slug) : Str::slug($name);

        if (empty($slug)) {
            $slug = 'danh-muc-' . time();
        }

        // Tìm danh mục đã có sẵn theo tên (không phân biệt hoa thường) hoặc slug
        $category = Category::whereRaw('LOWER(name) = ?', [mb_strtolower($name)])
            ->orWhere('slug', $slug)
            ->first();

        if (!$category) {
            $originalSlug = $slug;
            $count = 1;
            while (Category::where('slug', $slug)->exists()) {
                $slug = $originalSlug . '-' . $count++;
            }

            $category = Category::create([
                'name' => $name,
                'slug' => $slug,
                'icon' => $request->icon ?: 'folder',
                'description' => $request->description ?: "Danh mục đề thi môn {$name}"
            ]);
            Cache::forget('all_categories_list');
        }

        return response()->json([
            'success' => true,
            'message' => 'Thao tác danh mục thành công.',
            'data' => new CategoryResource($category)
        ], 200);
    }
}
