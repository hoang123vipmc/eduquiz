<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class LeaderboardController extends Controller
{
    public function index(Request $request)
    {
        $currentUserId = $request->user()->id;

        // Cache top 50 leaderboard trong 30 giây để chịu tải 100+ concurrent requests mà không làm sập DB
        $cachedLeaderboard = Cache::remember('global_leaderboard_top_50', 30, function () {
            return User::select('users.id', 'users.name', 'users.avatar')
                ->where('users.is_banned', false)
                ->join('quiz_attempts', 'users.id', '=', 'quiz_attempts.user_id')
                ->join('results', 'quiz_attempts.id', '=', 'results.attempt_id')
                ->selectRaw('SUM(results.correct_answers) as total_correct')
                ->selectRaw('COUNT(results.id) as total_quizzes')
                ->selectRaw('AVG(results.accuracy) as avg_accuracy')
                ->groupBy('users.id', 'users.name', 'users.avatar')
                ->havingRaw('COUNT(results.id) > 0')
                ->orderBy('total_correct', 'desc')
                ->orderBy('avg_accuracy', 'desc')
                ->take(50)
                ->get()
                ->toArray();
        });

        // Tái tạo collection và rank
        $rank = 1;
        $currentUserRank = null;
        $currentUserData = null;

        $leaderboard = array_map(function ($u) use (&$rank, $currentUserId, &$currentUserRank, &$currentUserData) {
            $u['rank'] = $rank++;
            $u['avg_accuracy'] = round((float) ($u['avg_accuracy'] ?? 0), 1);
            $u['total_correct'] = (int) ($u['total_correct'] ?? 0);
            $u['total_quizzes'] = (int) ($u['total_quizzes'] ?? 0);

            if ($u['id'] === $currentUserId) {
                $currentUserRank = $u['rank'];
                $currentUserData = $u;
            }

            return $u;
        }, $cachedLeaderboard);

        // Nếu user hiện tại không nằm trong top 50, cần query riêng để lấy rank của họ
        if (!$currentUserRank) {
            $userCacheKey = "user_rank_stats_{$currentUserId}";
            $currentUserData = Cache::remember($userCacheKey, 30, function () use ($request, $currentUserId) {
                $currentUserStats = DB::table('results')
                    ->join('quiz_attempts', 'results.attempt_id', '=', 'quiz_attempts.id')
                    ->where('quiz_attempts.user_id', $currentUserId)
                    ->selectRaw('SUM(correct_answers) as total_correct, AVG(accuracy) as avg_accuracy, COUNT(results.id) as total_quizzes')
                    ->first();

                if ($currentUserStats && $currentUserStats->total_quizzes > 0) {
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

                    $rank = $betterUsersCount + 1;
                    $user = $request->user();
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'avatar' => $user->avatar,
                        'total_correct' => (int) $currentUserStats->total_correct,
                        'total_quizzes' => (int) $currentUserStats->total_quizzes,
                        'avg_accuracy' => round((float) $currentUserStats->avg_accuracy, 1),
                        'rank' => $rank
                    ];
                }

                $user = $request->user();
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'avatar' => $user->avatar,
                    'total_correct' => 0,
                    'total_quizzes' => 0,
                    'avg_accuracy' => 0,
                    'rank' => '-'
                ];
            });
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
