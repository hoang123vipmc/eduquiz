<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use App\Models\Question;
use App\Http\Requests\StoreQuestionRequest;
use App\Http\Resources\QuestionResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QuestionController extends Controller
{
    public function index(Request $request, $quizId)
    {
        $quiz = Quiz::findOrFail($quizId);

        // ── Security: Private quiz questions only visible to owner or admin ─────────────
        if ($quiz->visibility === 'private') {
            $authUser = $request->user();
            if (!$authUser || ($authUser->id !== $quiz->user_id && $authUser->role !== 'admin')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không có quyền truy cập đề thi này.',
                ], 403);
            }
        }

        $questions = $quiz->questions()->with('options')->orderBy('order')->get();
        $request->attributes->set('quiz_owner_id', $quiz->user_id);

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách câu hỏi thành công.',
            'data'    => QuestionResource::collection($questions)
        ]);
    }

    public function store(StoreQuestionRequest $request, $quizId)
    {
        $quiz = Quiz::findOrFail($quizId);

        // ── Security: Only quiz owner or admin may add questions ─────────────────────
        if ($quiz->user_id !== $request->user()->id && $request->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền thêm câu hỏi vào đề thi này.',
            ], 403);
        }

        DB::beginTransaction();
        try {
            $data = $request->validated();
            $data['quiz_id'] = $quiz->id;

            $question = Question::create($data);

            if (isset($data['options']) && is_array($data['options'])) {
                foreach ($data['options'] as $optionData) {
                    $question->options()->create($optionData);
                }
            }

            DB::commit();

            $request->attributes->set('quiz_owner_id', $quiz->user_id);

            return response()->json([
                'success' => true,
                'message' => 'Tạo câu hỏi thành công.',
                'data'    => new QuestionResource($question->load('options'))
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi khi tạo câu hỏi.',
            ], 500);
        }
    }

    public function bank(Request $request)
    {
        $userId = $request->user()->id;
        $search = $request->query('search', '');
        $difficulty = $request->query('difficulty', '');
        
        $query = Question::with('quiz:id,title', 'options')
            ->whereHas('quiz', function ($q) use ($userId) {
                $q->where('user_id', $userId);
            });

        if ($search) {
            $query->where('question_text', 'like', "%{$search}%");
        }

        if ($difficulty) {
            $query->where('difficulty', $difficulty);
        }

        $questions = $query->orderBy('created_at', 'desc')->paginate(15);
        $request->attributes->set('quiz_owner_id', $userId);

        return response()->json([
            'success' => true,
            'data' => [
                'data' => QuestionResource::collection($questions->items()),
                'current_page' => $questions->currentPage(),
                'last_page' => $questions->lastPage(),
                'total' => $questions->total()
            ]
        ]);
    }

    public function update(Request $request, $id)
    {
        $question = Question::with('quiz')->findOrFail($id);

        if ($question->quiz->user_id !== $request->user()->id && $request->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền chỉnh sửa câu hỏi này.',
            ], 403);
        }

        $validated = $request->validate([
            'question_text' => 'sometimes|required|string',
            'question_type' => 'sometimes|required|in:single_choice,multiple_choice,true_false',
            'explanation'   => 'nullable|string',
            'points'        => 'sometimes|integer|min:1',
            'options'       => 'sometimes|array|min:2',
            'options.*.text' => 'required_with:options|string',
            'options.*.is_correct' => 'required_with:options|boolean',
        ]);

        DB::beginTransaction();
        try {
            $question->update(collect($validated)->except('options')->toArray());

            if (isset($validated['options'])) {
                $question->options()->delete();
                foreach ($validated['options'] as $optionData) {
                    $question->options()->create($optionData);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật câu hỏi thành công.',
                'data'    => new QuestionResource($question->fresh('options'))
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi cập nhật câu hỏi.',
            ], 500);
        }
    }

    public function destroy(Request $request, $id)
    {
        $question = Question::with('quiz')->findOrFail($id);

        if ($question->quiz->user_id !== $request->user()->id && $request->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền xóa câu hỏi này.',
            ], 403);
        }

        $quiz = $question->quiz;
        $question->delete();
        if ($quiz->total_questions > 0) {
            $quiz->decrement('total_questions');
        }

        return response()->json([
            'success' => true,
            'message' => 'Xóa câu hỏi thành công.'
        ]);
    }
}
