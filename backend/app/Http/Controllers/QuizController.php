<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use App\Http\Requests\StoreQuizRequest;
use App\Http\Resources\QuizResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

class QuizController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user('sanctum');

        if ($request->boolean('mine')) {
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vui lòng đăng nhập để xem danh sách đề thi của bạn.',
                ], 401);
            }
            $query = Quiz::with(['user', 'category'])->where('user_id', $user->id);
        } elseif ($user && $user->role === 'admin' && $request->boolean('admin_all')) {
            // Admin có quyền kiểm soát toàn bộ đề thi trong hệ thống
            $query = Quiz::with(['user', 'category']);
        } else {
            // Danh sách đề thi công khai chung cho mọi học viên
            $query = Quiz::with(['user', 'category'])->where('status', 'published')->where('visibility', 'public');
        }
        
        if ($request->has('category_id') && $request->category_id !== 'all') {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $quizzes = $query->latest('id')->paginate($request->get('per_page', 50));

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách đề thi thành công.',
            'data' => QuizResource::collection($quizzes)->response()->getData(true)
        ]);
    }

    public function show($slug)
    {
        $quiz = Quiz::with(['user', 'category'])
            ->where(function($q) use ($slug) {
                if (is_numeric($slug)) {
                    $q->where('id', $slug)->orWhere('slug', $slug);
                } else {
                    $q->where('slug', $slug);
                }
            })
            ->firstOrFail();
        
        return response()->json([
            'success' => true,
            'message' => 'Lấy thông tin đề thi thành công.',
            'data' => new QuizResource($quiz)
        ]);
    }

    public function store(StoreQuizRequest $request)
    {
        $data = $request->validated();
        $data['user_id'] = $request->user()->id;

        $baseSlug = !empty($data['slug']) ? Str::slug($data['slug']) : Str::slug($data['title']);
        if (empty($baseSlug)) {
            $baseSlug = 'quiz';
        }

        $slug = $baseSlug . '-' . Str::lower(Str::random(6)) . '-' . substr(uniqid(), -5);
        while (Quiz::where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . Str::lower(Str::random(8)) . '-' . (int)(microtime(true) * 1000);
        }
        $data['slug'] = $slug;

        $quiz = Quiz::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Tạo đề thi thành công.',
            'data' => new QuizResource($quiz)
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $quiz = Quiz::findOrFail($id);

        // Kiểm tra quyền (chỉ người tạo hoặc admin mới được chỉnh sửa)
        if ($quiz->user_id !== $request->user()->id && $request->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền chỉnh sửa đề thi này.'
            ], 403);
        }

        $validated = $request->validate([
            'category_id' => 'nullable|exists:categories,id',
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string|max:5000',
            'cover_image' => ['nullable', 'string', 'max:2048', function ($attr, $value, $fail) {
                if ($value && !preg_match('#^(https?://|data:image/(jpeg|png|webp|gif);base64,)#i', $value)) {
                    $fail('Ảnh bìa phải là URL hợp lệ (http/https).');
                }
            }],
            'duration_minutes' => 'sometimes|required|integer|min:1|max:600',
            'visibility' => 'nullable|in:public,private',
            'status' => 'nullable|in:draft,published',
            'shuffle_questions' => 'nullable|boolean',
            'shuffle_answers' => 'nullable|boolean',
            'allow_review' => 'nullable|boolean',
            'passing_score' => 'nullable|integer|min:0|max:100',
        ]);

        $quiz->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật đề thi thành công.',
            'data' => new QuizResource($quiz->fresh(['user', 'category']))
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $quiz = Quiz::findOrFail($id);
        
        // Kiểm tra quyền (chỉ người tạo hoặc admin mới được xoá)
        if ($quiz->user_id !== $request->user()->id && $request->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền xoá đề thi này.'
            ], 403);
        }

        $quiz->delete();

        return response()->json([
            'success' => true,
            'message' => 'Xoá đề thi thành công.'
        ]);
    }
}
