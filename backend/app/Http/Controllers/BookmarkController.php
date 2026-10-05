<?php

namespace App\Http\Controllers;

use App\Models\Question;
use App\Models\QuestionBookmark;
use App\Models\QuizAttempt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BookmarkController extends Controller
{
    /**
     * Lấy danh sách câu hỏi đã đánh dấu của người dùng
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $quizId = $request->query('quiz_id');
        $search = $request->query('search');

        $query = QuestionBookmark::where('user_id', $user->id)
            ->whereHas('quiz', function ($q) use ($user) {
                // ── Security: Chỉ hiển thị bookmark của đề public hoặc đề của chính user (hoặc admin) ──
                if ($user->role !== 'admin') {
                    $q->where(function ($sub) use ($user) {
                        $sub->where('visibility', 'public')
                            ->orWhere('user_id', $user->id);
                    });
                }
            })
            ->with([
                'question' => function ($q) {
                    $q->with('options');
                },
                'quiz:id,title,slug,category_id'
            ])
            ->latest();

        if ($quizId) {
            $query->where('quiz_id', $quizId);
        }

        if ($search) {
            $query->whereHas('question', function ($q) use ($search) {
                $q->where('question_text', 'like', "%{$search}%");
            });
        }

        $bookmarks = $query->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $bookmarks
        ]);
    }

    /**
     * Bật/Tắt đánh dấu một câu hỏi
     */
    public function toggle(Request $request)
    {
        $validated = $request->validate([
            'question_id' => 'required|exists:questions,id',
            'note' => 'nullable|string|max:1000'
        ]);

        $userId = $request->user()->id;
        $questionId = $validated['question_id'];

        $existing = QuestionBookmark::where('user_id', $userId)
            ->where('question_id', $questionId)
            ->first();

        if ($existing) {
            $existing->delete();
            return response()->json([
                'success' => true,
                'is_bookmarked' => false,
                'message' => 'Đã bỏ đánh dấu câu hỏi.'
            ]);
        }

        $question = Question::with('quiz')->findOrFail($questionId);

        // ── Security: Ngăn IDOR đánh dấu trái phép câu hỏi từ đề thi riêng tư ────────
        if ($question->quiz && $question->quiz->visibility === 'private') {
            $user = $request->user();
            if ($user->id !== $question->quiz->user_id && $user->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Bạn không có quyền đánh dấu câu hỏi từ đề thi riêng tư này.'
                ], 403);
            }
        }

        $bookmark = QuestionBookmark::create([
            'user_id' => $userId,
            'question_id' => $questionId,
            'quiz_id' => $question->quiz_id,
            'note' => $validated['note'] ?? null
        ]);

        return response()->json([
            'success' => true,
            'is_bookmarked' => true,
            'data' => $bookmark,
            'message' => 'Đã lưu câu hỏi vào Sổ tay câu khó!'
        ]);
    }

    /**
     * Lấy danh sách ID các câu hỏi đã được đánh dấu của user trong đề thi hiện tại
     */
    public function getBookmarkedIds(Request $request)
    {
        $userId = $request->user()->id;
        $quizId = $request->query('quiz_id');

        $query = QuestionBookmark::where('user_id', $userId);
        if ($quizId) {
            $query->where('quiz_id', $quizId);
        }

        $ids = $query->pluck('question_id')->all();

        return response()->json([
            'success' => true,
            'bookmarked_ids' => $ids
        ]);
    }

    /**
     * Cập nhật ghi chú cho câu hỏi đã đánh dấu
     */
    public function updateNote(Request $request, $id)
    {
        $validated = $request->validate([
            'note' => 'nullable|string|max:1000'
        ]);

        $bookmark = QuestionBookmark::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $bookmark->update(['note' => $validated['note']]);

        return response()->json([
            'success' => true,
            'data' => $bookmark,
            'message' => 'Đã cập nhật ghi chú học tập.'
        ]);
    }

    /**
     * Xóa bookmark theo id
     */
    public function destroy(Request $request, $id)
    {
        $bookmark = QuestionBookmark::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $bookmark->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đã xóa câu hỏi khỏi Sổ tay.'
        ]);
    }
}
