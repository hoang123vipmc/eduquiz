<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        // Chuẩn hóa email về chữ thường và xóa khoảng trắng thừa
        $request->merge([
            'email' => strtolower(trim((string) $request->input('email', ''))),
        ]);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'student_id' => 'nullable|string|max:20',
        ], [
            'name.required' => 'Vui lòng nhập họ tên.',
            'email.required' => 'Vui lòng nhập email.',
            'email.unique' => 'Email này đã được sử dụng.',
            'password.required' => 'Vui lòng nhập mật khẩu.',
            'password.min' => 'Mật khẩu phải có ít nhất 8 ký tự.',
            'password.confirmed' => 'Xác nhận mật khẩu không khớp.',
        ]);

        // ── Security: Đăng ký công khai luôn gán vai trò student để tránh chiếm quyền Admin ──
        $role = 'student';

        try {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => $request->password, // Laravel 11 tự động hash vì có cast 'hashed' trong User model
                'role' => $role,
                'student_id' => $request->student_id ?: null,
            ]);
        } catch (\Illuminate\Database\QueryException $e) {
            // Bắt lỗi Race Condition: Nếu 100 người cùng gửi đăng ký với cùng 1 email ở cùng 1 mili-giây,
            // cả 100 request đều vượt qua validation SELECT count(*), nhưng Database chỉ cho phép 1 người insert thành công.
            // 99 người còn lại sẽ bị chặn bởi Unique Constraint. Chúng ta chuyển lỗi SQL 23000 thành lỗi Validation 422 thân thiện.
            if ($e->getCode() == 23000 || str_contains($e->getMessage(), 'Duplicate entry') || str_contains($e->getMessage(), 'UNIQUE')) {
                throw ValidationException::withMessages([
                    'email' => ['Email này đã được sử dụng.'],
                ]);
            }
            throw $e;
        }

        return response()->json([
            'success' => true,
            'message' => 'Đăng ký thành công.',
            'data' => [
                'user' => $user,
                'token' => $user->createToken('auth_token')->plainTextToken,
            ]
        ]);
    }

    public function login(Request $request)
    {
        $request->merge([
            'email' => strtolower(trim((string) $request->input('email', ''))),
        ]);

        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ], [
            'email.required' => 'Vui lòng nhập email.',
            'password.required' => 'Vui lòng nhập mật khẩu.',
        ]);

        // ── Security: Chặn tấn công dò mật khẩu (Brute Force / Credential Stuffing) ──
        // Tối đa 5 lần đăng nhập sai trên mỗi cặp email + IP trong 60 giây
        $throttleKey = Str::transliterate($request->input('email') . '|' . $request->ip());

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return response()->json([
                'success' => false,
                'message' => "Quá nhiều lần đăng nhập không thành công. Vui lòng thử lại sau {$seconds} giây.",
            ], 429);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            RateLimiter::hit($throttleKey, 60);
            throw ValidationException::withMessages([
                'email' => ['Thông tin đăng nhập không chính xác.'],
            ]);
        }

        // Đăng nhập thành công -> Xóa bộ đếm số lần thử sai
        RateLimiter::clear($throttleKey);

        if ($user->is_banned) {
            return response()->json([
                'success' => false,
                'message' => 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.',
            ], 403);
        }

        // Tự động đồng bộ quyền Admin nếu email trùng khớp với cấu hình ADMIN_EMAIL hoặc Chủ sở hữu
        if ($user->isOwnerOrSuperAdmin() && $user->role !== 'admin') {
            $user->role = 'admin';
        }

        $user->last_login_at = now();
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Đăng nhập thành công.',
            'data' => [
                'user' => $user,
                'token' => $user->createToken('auth_token')->plainTextToken,
            ]
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đăng xuất thành công.',
            'data' => null
        ]);
    }
}


