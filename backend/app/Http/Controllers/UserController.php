<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Result;
use App\Models\QuizAttempt;

class UserController extends Controller
{
    public function stats(Request $request)
    {
        $userId = $request->user()->id;

        $results = Result::whereHas('attempt', function ($query) use ($userId) {
            $query->where('user_id', $userId);
        })->get();
        
        $totalQuizzes = $results->count();
        $avgAccuracy = $totalQuizzes > 0 ? $results->avg('accuracy') : 0;
        $totalTimeSeconds = $results->sum('time_taken_seconds');

        // Tính chuỗi ngày học liên tiếp (Streak) - Đơn giản hóa: Trả về số ngày phân biệt đã làm bài
        $streak = Result::whereHas('attempt', function ($query) use ($userId) {
                $query->where('user_id', $userId);
            })
            ->selectRaw('DATE(created_at) as date')
            ->groupBy('date')
            ->get()
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_quizzes' => $totalQuizzes,
                'accuracy' => round($avgAccuracy, 1),
                'total_time_seconds' => $totalTimeSeconds,
                'streak_days' => $streak
            ]
        ]);
    }

    public function history(Request $request)
    {
        $userId = $request->user()->id;

        $history = Result::with('attempt.quiz:id,title,category_id', 'attempt.quiz.category:id,name,icon')
            ->whereHas('attempt', function ($query) use ($userId) {
                $query->where('user_id', $userId);
            })
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($result) {
                // Đưa quiz ra cấp độ root của history item để Frontend dễ sử dụng
                $item = $result->toArray();
                $item['quiz'] = $result->attempt->quiz ?? null;
                return $item;
            });

        return response()->json([
            'success' => true,
            'data' => $history
        ]);
    }
}
