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
        $questions = $quiz->questions()->with('options')->orderBy('order')->get();
        $request->attributes->set('quiz_owner_id', $quiz->user_id);

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách câu hỏi thành công.',
            'data' => QuestionResource::collection($questions)
        ]);
    }

    public function store(StoreQuestionRequest $request, $quizId)
    {
        $quiz = Quiz::findOrFail($quizId);

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
                'data' => new QuestionResource($question->load('options'))
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi khi tạo câu hỏi.',
                'error' => $e->getMessage()
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
}
