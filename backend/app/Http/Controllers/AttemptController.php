<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\Question;
use App\Models\UserAnswer;
use App\Models\Result;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AttemptController extends Controller
{
    public function start(Request $request)
    {
        $request->validate([
            'quiz_id' => 'required|exists:quizzes,id',
            'mode' => 'required|in:practice,exam',
            'unlimited' => 'nullable|boolean'
        ]);

        $quiz = Quiz::findOrFail($request->quiz_id);

        // Kiểm tra xem có bài đang làm dở với cùng chế độ không
        $existingAttempt = QuizAttempt::where('user_id', $request->user()->id)
            ->where('quiz_id', $quiz->id)
            ->where('mode', $request->mode)
            ->where('status', 'doing')
            ->first();

        if ($existingAttempt) {
            return $this->resume($request, $existingAttempt->id);
        }

        $isUnlimited = $request->input('unlimited', false);
        $remainingTime = $isUnlimited ? null : $quiz->duration_minutes * 60;

        $attempt = QuizAttempt::create([
            'user_id' => $request->user()->id,
            'quiz_id' => $quiz->id,
            'mode' => $request->mode,
            'started_at' => now(),
            'remaining_time' => $remainingTime,
            'status' => 'doing'
        ]);

        if ($attempt->mode === 'practice') {
            $request->attributes->set('is_practice_mode', true);
        }
        $request->attributes->set('quiz_owner_id', $quiz->user_id);

        // Trả về trạng thái bắt đầu và danh sách câu hỏi
        return response()->json([
            'success' => true,
            'message' => 'Bắt đầu làm bài.',
            'data' => [
                'attempt_id' => $attempt->id,
                'mode' => $attempt->mode,
                'remaining_time' => $attempt->remaining_time,
                'elapsed_time' => 0,
                'questions' => \App\Http\Resources\QuestionResource::collection($quiz->questions()->with('options')->get())
            ]
        ]);
    }

    public function resume(Request $request, $id)
    {
        $attempt = QuizAttempt::with('answers')->where('user_id', $request->user()->id)->findOrFail($id);

        if ($attempt->status !== 'doing') {
            return response()->json([
                'success' => false,
                'message' => 'Bài thi đã kết thúc.',
                'data' => ['status' => $attempt->status]
            ], 400);
        }

        if ($attempt->mode === 'practice') {
            $request->attributes->set('is_practice_mode', true);
        }
        
        $request->attributes->set('quiz_owner_id', $attempt->quiz->user_id);

        if ($attempt->remaining_time !== null) {
            // Tính toán lại thời gian
            $elapsed = now()->diffInSeconds($attempt->started_at);
            $totalSeconds = $attempt->quiz->duration_minutes * 60;
            $remaining = max(0, $totalSeconds - $elapsed);
            
            $attempt->update(['remaining_time' => $remaining]);

            if ($remaining <= 0) {
                return $this->submit($request, $id);
            }
        }

        // Cũng trả về luôn danh sách câu hỏi để giao diện lấy (bởi vì resume không có payload từ trước)
        $quiz = $attempt->quiz;
        return response()->json([
            'success' => true,
            'message' => 'Khôi phục trạng thái làm bài.',
            'data' => [
                'attempt_id' => $attempt->id,
                'mode' => $attempt->mode,
                'remaining_time' => $attempt->remaining_time,
                'elapsed_time' => now()->diffInSeconds($attempt->started_at),
                'answers' => $attempt->answers()->pluck('option_id', 'question_id'),
                'questions' => \App\Http\Resources\QuestionResource::collection($quiz->questions()->with('options')->get())
            ]
        ]);
    }

    public function saveAnswer(Request $request, $id)
    {
        $request->validate([
            'question_id' => 'required|exists:questions,id',
            'option_id' => 'required|exists:options,id'
        ]);

        $attempt = QuizAttempt::where('user_id', $request->user()->id)->findOrFail($id);

        if ($attempt->status !== 'doing') {
            return response()->json(['success' => false, 'message' => 'Bài thi đã kết thúc.'], 400);
        }

        if ($attempt->remaining_time !== null) {
            // Cập nhật remaining time
            $elapsed = now()->diffInSeconds($attempt->started_at);
            $remaining = max(0, ($attempt->quiz->duration_minutes * 60) - $elapsed);

            if ($remaining <= 0) {
                return $this->submit($request, $id);
            }

            $attempt->update(['remaining_time' => $remaining]);
        }

        $option = \App\Models\Option::findOrFail($request->option_id);

        UserAnswer::updateOrCreate(
            ['attempt_id' => $attempt->id, 'question_id' => $request->question_id],
            [
                'option_id' => $option->id,
                'is_correct' => $option->is_correct,
                'answered_at' => now()
            ]
        );

        return response()->json(['success' => true, 'message' => 'Đã lưu đáp án.']);
    }

    public function submit(Request $request, $id)
    {
        $attempt = QuizAttempt::where('user_id', $request->user()->id)->findOrFail($id);

        if ($attempt->status !== 'doing') {
            return response()->json(['success' => false, 'message' => 'Bài thi đã được nộp trước đó.']);
        }

        DB::beginTransaction();
        try {
            $attempt->update([
                'status' => 'submitted',
                'ended_at' => now()
            ]);

            $answers = UserAnswer::where('attempt_id', $attempt->id)->get();
            $questions = $attempt->quiz->questions;
            $questionsMap = $questions->keyBy('id');

            $totalPoints = $questions->sum('points');
            $correctPoints = 0;
            $correctCount = 0;
            $wrongCount = 0;

            foreach ($answers as $answer) {
                if ($answer->is_correct) {
                    $correctCount++;
                    $q = $questionsMap->get($answer->question_id);
                    if ($q) {
                        $correctPoints += $q->points;
                    }
                } else {
                    $wrongCount++;
                }
            }

            $skippedCount = $questions->count() - $answers->count();
            $score = $totalPoints > 0 ? ($correctPoints / $totalPoints) * 100 : 0;
            $accuracy = $questions->count() > 0 ? ($correctCount / $questions->count()) * 100 : 0;
            $timeTaken = (int) abs(now()->diffInSeconds($attempt->started_at));

            $result = Result::create([
                'attempt_id' => $attempt->id,
                'score' => round($score, 2),
                'correct_answers' => $correctCount,
                'wrong_answers' => $wrongCount,
                'skipped_answers' => $skippedCount,
                'accuracy' => round($accuracy, 2),
                'time_taken_seconds' => $timeTaken
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Nộp bài thành công.',
                'data' => $result
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Lỗi nộp bài: ' . $e->getMessage() . ' at line ' . $e->getLine()], 500);
        }
    }

    public function result(Request $request, $id)
    {
        $result = Result::with('attempt')->where('id', $id)
            ->whereHas('attempt', function ($query) use ($request) {
                $query->where('user_id', $request->user()->id);
            })->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $result
        ]);
    }

    public function retryWrong(Request $request, $id)
    {
        $oldAttempt = QuizAttempt::with('answers')->where('user_id', $request->user()->id)->findOrFail($id);

        if ($oldAttempt->status !== 'submitted') {
            return response()->json(['success' => false, 'message' => 'Bài thi trước đó chưa hoàn thành.'], 400);
        }

        DB::beginTransaction();
        try {
            $newAttempt = QuizAttempt::create([
                'user_id' => $request->user()->id,
                'quiz_id' => $oldAttempt->quiz_id,
                'mode' => 'practice',
                'started_at' => now(),
                'remaining_time' => null, // Mặc định không giới hạn thời gian cho việc làm lại
                'status' => 'doing'
            ]);

            // Copy lại các đáp án đúng từ attempt cũ
            foreach ($oldAttempt->answers as $ans) {
                if ($ans->is_correct) {
                    UserAnswer::create([
                        'attempt_id' => $newAttempt->id,
                        'question_id' => $ans->question_id,
                        'option_id' => $ans->option_id,
                        'is_correct' => true,
                        'answered_at' => now()
                    ]);
                }
            }

            DB::commit();

            // Setup attributes for practice mode
            $request->attributes->set('is_practice_mode', true);

            $quiz = $newAttempt->quiz;
            $request->attributes->set('quiz_owner_id', $quiz->user_id);
            return response()->json([
                'success' => true,
                'message' => 'Bắt đầu làm lại các câu sai.',
                'data' => [
                    'attempt_id' => $newAttempt->id,
                    'mode' => $newAttempt->mode,
                    'remaining_time' => null,
                    'answers' => $newAttempt->answers()->pluck('option_id', 'question_id'),
                    'questions' => \App\Http\Resources\QuestionResource::collection($quiz->questions()->with('options')->get())
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Lỗi tạo bài thi mới.'], 500);
        }
    }

    public function clearWrong(Request $request, $id)
    {
        $attempt = QuizAttempt::where('user_id', $request->user()->id)->findOrFail($id);

        if ($attempt->status !== 'doing') {
            return response()->json(['success' => false, 'message' => 'Chỉ có thể xóa đáp án sai khi bài thi đang diễn ra.'], 400);
        }

        // Xóa tất cả các câu trả lời sai của attempt này
        UserAnswer::where('attempt_id', $attempt->id)
            ->where('is_correct', '!=', 1)
            ->delete();

        // Load lại answers bằng fresh query để đảm bảo đồng bộ
        $answers = UserAnswer::where('attempt_id', $attempt->id)
            ->pluck('option_id', 'question_id');

        return response()->json([
            'success' => true,
            'message' => 'Đã xóa các câu trả lời sai.',
            'data' => [
                'answers' => $answers
            ]
        ]);
    }
}
