<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use App\Models\Result;
use App\Models\QuizAttempt;

class UserController extends Controller
{
    public function stats(Request $request)
    {
        $userId = $request->user()->id;

        $stats = DB::table('results')
            ->join('quiz_attempts', 'results.attempt_id', '=', 'quiz_attempts.id')
            ->where('quiz_attempts.user_id', $userId)
            ->selectRaw('COUNT(*) as total_quizzes, AVG(accuracy) as avg_accuracy, SUM(time_taken_seconds) as total_time_seconds')
            ->first();

        $totalQuizzes = (int) ($stats->total_quizzes ?? 0);
        $avgAccuracy = (float) ($stats->avg_accuracy ?? 0);
        $totalTimeSeconds = (int) ($stats->total_time_seconds ?? 0);

        // Tính chuỗi ngày học liên tiếp (Streak) - Trả về số ngày phân biệt đã làm bài
        $streak = DB::table('results')
            ->join('quiz_attempts', 'results.attempt_id', '=', 'quiz_attempts.id')
            ->where('quiz_attempts.user_id', $userId)
            ->selectRaw('DATE(results.created_at) as date')
            ->groupBy('date')
            ->get()
            ->count();

        // Lấy dữ liệu trend 7 ngày gần nhất
        $sevenDaysAgo = now()->subDays(6)->startOfDay();
        
        $trend = DB::table('results')
            ->join('quiz_attempts', 'results.attempt_id', '=', 'quiz_attempts.id')
            ->where('quiz_attempts.user_id', $userId)
            ->where('results.created_at', '>=', $sevenDaysAgo)
            ->selectRaw('DATE(results.created_at) as date, AVG(accuracy) as avg_accuracy, SUM(time_taken_seconds) as total_time_seconds, COUNT(*) as quizzes_count')
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get()
            ->map(function ($item) {
                return [
                    'date' => \Carbon\Carbon::parse($item->date)->format('d/m'),
                    'accuracy' => round((float) $item->avg_accuracy, 1),
                    'time_minutes' => round(((int) $item->total_time_seconds) / 60, 1),
                    'quizzes' => (int) $item->quizzes_count
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'total_quizzes' => $totalQuizzes,
                'accuracy' => round($avgAccuracy, 1),
                'total_time_seconds' => $totalTimeSeconds,
                'streak_days' => $streak,
                'trend' => $trend
            ]
        ]);
    }

    public function history(Request $request)
    {
        $userId = $request->user()->id;

        $history = Result::with('attempt.quiz:id,title,category_id,total_questions,duration_minutes,slug', 'attempt.quiz.category:id,name,icon')
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
                $quizTotal = $result->attempt?->quiz?->total_questions;
                $calculatedTotal = $result->correct_answers + $result->wrong_answers + ($result->skipped_answers ?? 0);
                $item['total_questions'] = $quizTotal ?: ($calculatedTotal > 0 ? $calculatedTotal : null);
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
            'name'   => 'required|string|max:255',
            'avatar' => ['nullable', 'string', 'max:2048', function ($attr, $value, $fail) {
                // Chỉ cho phép URL http/https hoặc data URI ảnh - ngăn JavaScript URI (XSS)
                if ($value && !preg_match('#^(https?://|data:image/(jpeg|png|webp|gif);base64,)#i', $value)) {
                    $fail('Avatar phải là URL ảnh hợp lệ (http/https).');
                }
            }],
        ]);

        $user = $request->user();
        $user->name = $request->name;
        if ($request->has('avatar')) {
            $user->avatar = $request->avatar;
        }
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
