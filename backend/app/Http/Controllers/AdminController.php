<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Result;
use App\Models\QuizAttempt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    // ───────────────────────────────────────────────────────────────
    //  OVERVIEW STATS
    // ───────────────────────────────────────────────────────────────

    public function overview()
    {
        $totalUsers     = User::count();
        $newUsersWeek   = User::where('created_at', '>=', now()->subDays(7))->count();
        $totalAttempts  = QuizAttempt::count();
        $bannedUsers    = User::where('is_banned', true)->count();
        $adminUsers     = User::where('role', 'admin')->count();

        // Users registered per day for last 14 days
        $userTrend = User::where('created_at', '>=', now()->subDays(13)->startOfDay())
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn($r) => [
                'date'  => \Carbon\Carbon::parse($r->date)->format('d/m'),
                'count' => $r->count,
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'total_users'    => $totalUsers,
                'new_users_week' => $newUsersWeek,
                'total_attempts' => $totalAttempts,
                'banned_users'   => $bannedUsers,
                'admin_users'    => $adminUsers,
                'user_trend'     => $userTrend,
            ]
        ]);
    }

    // ───────────────────────────────────────────────────────────────
    //  USER LIST
    // ───────────────────────────────────────────────────────────────

    public function users(Request $request)
    {
        $query = User::withCount(['attempts']);

        // Search by name or email
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter by role
        if ($role = $request->query('role')) {
            $query->where('role', $role);
        }

        // Filter by status
        if ($request->query('status') === 'banned') {
            $query->where('is_banned', true);
        } elseif ($request->query('status') === 'active') {
            $query->where('is_banned', false);
        }

        $users = $query->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data'    => $users,
        ]);
    }

    // ───────────────────────────────────────────────────────────────
    //  USER DETAIL
    // ───────────────────────────────────────────────────────────────

    public function userDetail(int $id)
    {
        $user = User::withCount(['attempts'])->findOrFail($id);

        // Last 10 attempts
        $history = Result::with('attempt.quiz:id,title,slug')
            ->whereHas('attempt', fn($q) => $q->where('user_id', $id))
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get()
            ->map(fn($r) => [
                'quiz_title'        => $r->attempt?->quiz?->title,
                'score'             => $r->score,
                'accuracy'          => $r->accuracy,
                'time_taken_seconds'=> $r->time_taken_seconds,
                'created_at'        => $r->created_at,
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'user'    => $user,
                'history' => $history,
            ]
        ]);
    }

    // ───────────────────────────────────────────────────────────────
    //  BAN / UNBAN
    // ───────────────────────────────────────────────────────────────

    public function toggleBan(int $id, Request $request)
    {
        $admin = $request->user();
        $user  = User::findOrFail($id);

        if ($user->id === $admin->id) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không thể tự khóa tài khoản của mình.',
            ], 400);
        }

        // ── Security: Ngăn admin khóa tài khoản của admin khác (privilege confusion) ──
        // Chỉ cho phép khóa account có role thấp hơn hoặc bằng
        if ($user->role === 'admin' && $admin->role === 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Không thể khóa tài khoản Quản trị viên khác. Hãy hạ quyền trước.',
            ], 403);
        }

        $user->is_banned = !$user->is_banned;
        $user->save();

        // Revoke all tokens nếu khóa
        if ($user->is_banned) {
            $user->tokens()->delete();
        }

        return response()->json([
            'success' => true,
            'message' => $user->is_banned ? 'Đã khóa tài khoản.' : 'Đã mở khóa tài khoản.',
            'data'    => ['is_banned' => $user->is_banned],
        ]);
    }

    // ───────────────────────────────────────────────────────────────
    //  CHANGE ROLE
    // ───────────────────────────────────────────────────────────────

    public function changeRole(int $id, Request $request)
    {
        $request->validate([
            'role' => 'required|in:admin,teacher,student',
        ]);

        $admin = $request->user();
        $user  = User::findOrFail($id);

        if ($user->id === $admin->id) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không thể tự thay đổi quyền của mình.',
            ], 400);
        }

        // ── Security: Ngăn admin nâng quyền admin cho người khác nếu không phải super admin ──
        // Chỉ admin mới có thể cấp quyền admin, nhưng không thể cấp cho người đã là admin
        // (Privilege escalation prevention)
        if ($request->role === 'admin' && $user->role === 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Người dùng này đã là Quản trị viên.',
            ], 400);
        }

        $user->role = $request->role;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật quyền hạn thành công.',
            'data'    => ['role' => $user->role],
        ]);
    }

    // ───────────────────────────────────────────────────────────────
    //  RESET PASSWORD
    // ───────────────────────────────────────────────────────────────

    public function resetPassword(int $id, Request $request)
    {
        $request->validate([
            // Tối thiểu 8 ký tự, nhất quán với trang đăng ký
            'new_password' => 'required|string|min:8',
        ], [
            'new_password.min' => 'Mật khẩu mới phải có ít nhất 8 ký tự.',
        ]);

        $admin = $request->user();
        $user  = User::findOrFail($id);

        // ── Security: Admin không thể reset password của chính mình qua route này ──
        if ($user->id === $admin->id) {
            return response()->json([
                'success' => false,
                'message' => 'Hãy dùng tính năng đổi mật khẩu trong cài đặt tài khoản.',
            ], 400);
        }

        // ── Security: Admin không thể reset password của admin khác ──
        if ($user->role === 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Không thể đặt lại mật khẩu cho tài khoản Quản trị viên khác.',
            ], 403);
        }

        if ($user->provider_id && !$user->password) {
            return response()->json([
                'success' => false,
                'message' => 'Tài khoản này đăng nhập qua Google, không thể đặt lại mật khẩu.',
            ], 400);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        // Revoke all tokens to force re-login
        $user->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đã đặt lại mật khẩu. Người dùng sẽ cần đăng nhập lại.',
        ]);
    }

    // ───────────────────────────────────────────────────────────────
    //  DELETE USER
    // ───────────────────────────────────────────────────────────────

    public function deleteUser(int $id, Request $request)
    {
        $admin = $request->user();
        $user  = User::findOrFail($id);

        if ($user->id === $admin->id) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không thể xóa tài khoản của chính mình.',
            ], 400);
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đã xóa tài khoản thành công.',
        ]);
    }
}
