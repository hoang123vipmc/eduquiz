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
    public function index($quizId)
    {
        $quiz = Quiz::findOrFail($quizId);
        $questions = $quiz->questions()->with('options')->orderBy('order')->get();

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
}
