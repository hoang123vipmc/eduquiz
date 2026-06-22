<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use App\Http\Requests\StoreQuizRequest;
use App\Http\Resources\QuizResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class QuizController extends Controller
{
    public function index(Request $request)
    {
        $query = Quiz::with(['user', 'category'])->where('status', 'published')->where('visibility', 'public');
        
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        $quizzes = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách đề thi thành công.',
            'data' => QuizResource::collection($quizzes)->response()->getData(true)
        ]);
    }

    public function show($slug)
    {
        $quiz = Quiz::with(['user', 'category'])->where('slug', $slug)->firstOrFail();
        
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

        $quiz = Quiz::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Tạo đề thi thành công.',
            'data' => new QuizResource($quiz)
        ], 201);
    }

    public function destroy(Request $request, $id)
    {
        $quiz = Quiz::findOrFail($id);
        
        // Kiểm tra quyền (chỉ người tạo hoặc admin mới được xoá)
        if ($quiz->user_id !== $request->user()->id) {
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
