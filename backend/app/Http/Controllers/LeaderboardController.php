<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class LeaderboardController extends Controller
{
    public function index(Request $request)
    {
        $currentUserId = $request->user()->id;

        // Xếp hạng dựa trên tổng số câu đúng, sau đó đến độ chính xác trung bình
        $leaderboard = User::select('users.id', 'users.name', 'users.avatar')
            ->join('quiz_attempts', 'users.id', '=', 'quiz_attempts.user_id')
            ->join('results', 'quiz_attempts.id', '=', 'results.attempt_id')
            ->selectRaw('SUM(results.correct_answers) as total_correct')
            ->selectRaw('COUNT(results.id) as total_quizzes')
            ->selectRaw('AVG(results.accuracy) as avg_accuracy')
            ->groupBy('users.id', 'users.name', 'users.avatar')
            ->havingRaw('COUNT(results.id) > 0') // Chỉ lấy user đã làm bài
            ->orderBy('total_correct', 'desc')
            ->orderBy('avg_accuracy', 'desc')
            ->take(50) // Lấy top 50
            ->get();

        // Gắn rank cho từng user
        $rank = 1;
        $currentUserRank = null;
        $currentUserData = null;

        $leaderboard->transform(function ($user) use (&$rank, $currentUserId, &$currentUserRank, &$currentUserData) {
            $user->rank = $rank++;
            $user->avg_accuracy = round($user->avg_accuracy, 1);
            
            if ($user->id === $currentUserId) {
                $currentUserRank = $user->rank;
                $currentUserData = $user;
            }
            
            return $user;
        });

        // Nếu user hiện tại không nằm trong top 50, cần query riêng để lấy rank của họ
        if (!$currentUserRank) {
            // Đếm số người có điểm cao hơn user hiện tại
            $currentUserStats = DB::table('results')
                ->join('quiz_attempts', 'results.attempt_id', '=', 'quiz_attempts.id')
                ->where('quiz_attempts.user_id', $currentUserId)
                ->selectRaw('SUM(correct_answers) as total_correct, AVG(accuracy) as avg_accuracy, COUNT(results.id) as total_quizzes')
                ->first();

            if ($currentUserStats && $currentUserStats->total_quizzes > 0) {
                // Đếm những người có total_correct lớn hơn, hoặc bằng nhưng avg_accuracy lớn hơn
                $betterUsersCount = DB::table('results')
                    ->join('quiz_attempts', 'results.attempt_id', '=', 'quiz_attempts.id')
                    ->selectRaw('quiz_attempts.user_id, SUM(correct_answers) as total_correct, AVG(accuracy) as avg_accuracy')
                    ->groupBy('quiz_attempts.user_id')
                    ->havingRaw('SUM(correct_answers) > ? OR (SUM(correct_answers) = ? AND AVG(accuracy) > ?)', [
                        $currentUserStats->total_correct,
                        $currentUserStats->total_correct,
                        $currentUserStats->avg_accuracy
                    ])
                    ->count();

                $currentUserRank = $betterUsersCount + 1;
                $user = $request->user();
                $currentUserData = [
                    'id' => $user->id,
                    'name' => $user->name,
                    'avatar' => $user->avatar,
                    'total_correct' => $currentUserStats->total_correct,
                    'total_quizzes' => $currentUserStats->total_quizzes,
                    'avg_accuracy' => round($currentUserStats->avg_accuracy, 1),
                    'rank' => $currentUserRank
                ];
            } else {
                // Chưa làm bài nào
                $user = $request->user();
                $currentUserData = [
                    'id' => $user->id,
                    'name' => $user->name,
                    'avatar' => $user->avatar,
                    'total_correct' => 0,
                    'total_quizzes' => 0,
                    'avg_accuracy' => 0,
                    'rank' => '-'
                ];
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'leaderboard' => $leaderboard,
                'current_user' => $currentUserData
            ]
        ]);
    }
}
