<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\Result;
use App\Models\QuizAttempt;

class UserController extends Controller
{
    public function stats(Request $request)
    {
        $userId = $request->user()->id;

        $stats = Result::whereHas('attempt', function ($query) use ($userId) {
            $query->where('user_id', $userId);
        })
        ->selectRaw('COUNT(*) as total_quizzes, AVG(accuracy) as avg_accuracy, SUM(time_taken_seconds) as total_time_seconds')
        ->first();

        $totalQuizzes = $stats->total_quizzes ?? 0;
        $avgAccuracy = $stats->avg_accuracy ?? 0;
        $totalTimeSeconds = $stats->total_time_seconds ?? 0;

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
            ->take(15)
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

    public function updateProfile(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $user = $request->user();
        $user->name = $request->name;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật thông tin thành công.',
            'data' => $user
        ]);
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        $user = $request->user();

        // Kiểm tra xem người dùng có đăng nhập bằng provider ngoài (Google) không
        if ($user->provider_id && !$user->password) {
            return response()->json([
                'success' => false,
                'message' => 'Tài khoản đăng nhập qua dịch vụ ngoài không thể đổi mật khẩu.'
            ], 400);
        }

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Mật khẩu hiện tại không chính xác.'
            ], 400);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Đổi mật khẩu thành công.'
        ]);
    }
}
