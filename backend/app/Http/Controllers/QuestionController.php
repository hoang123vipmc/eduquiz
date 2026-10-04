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
                foreach ($data['options'] as $idx => $optionData) {
                    $question->options()->create([
                        'option_text' => $optionData['option_text'] ?? $optionData['text'] ?? '',
                        'is_correct'  => !empty($optionData['is_correct']),
                        'order'       => $optionData['order'] ?? $idx,
                    ]);
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
        
        $quizId = $request->query('quiz_id');
        
        $query = Question::with('quiz:id,title,user_id', 'options');

        if (!($request->user()->role === 'admin' && $request->boolean('all_users'))) {
            $query->whereHas('quiz', function ($q) use ($userId) {
                $q->where('user_id', $userId);
            });
        }

        if ($search) {
            $query->where('question_text', 'like', "%{$search}%");
        }

        if ($difficulty) {
            $query->where('difficulty', $difficulty);
        }

        if ($quizId) {
            $query->where('quiz_id', $quizId);
        }

        $questions = $query->orderBy('created_at', 'desc')->paginate(15);
        $request->attributes->set('quiz_owner_id', $userId);

        $userQuizzes = ($request->user()->role === 'admin' && $request->boolean('all_users'))
            ? Quiz::select('id', 'title')->orderBy('title')->get()
            : Quiz::where('user_id', $userId)->select('id', 'title')->orderBy('title')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'data' => QuestionResource::collection($questions->items()),
                'current_page' => $questions->currentPage(),
                'last_page' => $questions->lastPage(),
                'total' => $questions->total(),
                'user_quizzes' => $userQuizzes
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
            'type'          => 'sometimes|nullable|string',
            'question_type' => 'sometimes|nullable|string',
            'explanation'   => 'nullable|string',
            'points'        => 'sometimes|integer|min:1',
            'difficulty'    => 'sometimes|in:easy,medium,hard',
            'options'       => 'sometimes|array|min:2',
            'options.*.text' => 'nullable|string',
            'options.*.option_text' => 'nullable|string',
            'options.*.is_correct' => 'required_with:options|boolean',
        ]);

        DB::beginTransaction();
        try {
            $type = $validated['type'] ?? $validated['question_type'] ?? null;
            $questionData = collect($validated)->except(['options', 'question_type'])->toArray();
            if ($type) {
                $questionData['type'] = $type;
            }
            $question->update($questionData);

            if (isset($validated['options'])) {
                $question->options()->delete();
                foreach ($validated['options'] as $idx => $optionData) {
                    $question->options()->create([
                        'option_text' => $optionData['option_text'] ?? $optionData['text'] ?? '',
                        'is_correct'  => !empty($optionData['is_correct']),
                        'order'       => $optionData['order'] ?? $idx,
                    ]);
                }
            }

            DB::commit();

            $request->attributes->set('quiz_owner_id', $question->quiz->user_id);

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật câu hỏi thành công.',
                'data'    => new QuestionResource($question->fresh('options'))
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('QuestionController update error: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi máy chủ khi cập nhật câu hỏi. Vui lòng thử lại sau.',
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
