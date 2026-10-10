<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

class SocialiteController extends Controller
{
    public function redirect(Request $request, $provider)
    {
        if ($provider !== 'google') {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Phương thức đăng nhập không được hỗ trợ.'
                ], 400);
            }
            return redirect()->away(rtrim(config('app.frontend_url') ?: 'https://openquiz-free.vercel.app', '/') . '/login?error=unsupported_provider');
        }

        $targetUrl = Socialite::driver($provider)->stateless()->redirect()->getTargetUrl();

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'url' => $targetUrl
            ]);
        }

        return redirect()->away($targetUrl);
    }

    public function callback(Request $request, $provider)
    {
        $frontendUrl = rtrim(config('app.frontend_url') ?: env('FRONTEND_URL') ?: 'https://openquiz-free.vercel.app', '/');

        if ($provider !== 'google') {
            return redirect()->away($frontendUrl . '/login?error=unsupported_provider');
        }

        try {
            $socialUser = Socialite::driver($provider)->stateless()->user();
            $socialEmail = strtolower(trim((string) $socialUser->getEmail()));
            
            $user = User::where('email', $socialEmail)->first();

            if (!$user) {
                $adminEmail = config('app.admin_email') ?: env('ADMIN_EMAIL');
                $isOwner = ($adminEmail && $socialEmail === strtolower($adminEmail))
                    || $socialEmail === 'hoangdeptraivodich12@gmail.com';
                $role = $isOwner ? 'admin' : 'student';

                $userName = $socialUser->getName() ?: $socialUser->getNickname();
                if (!$userName) {
                    $parts = explode('@', $socialEmail ?: 'user');
                    $userName = $parts[0] ?: 'User';
                }

                $user = User::create([
                    'name'        => $userName,
                    'email'       => $socialEmail,
                    'password'    => Hash::make(Str::random(32)),
                    'avatar'      => $socialUser->getAvatar(),
                    'role'        => $role,
                    'provider_id' => (string) $socialUser->getId(),
                ]);
            } else {
                if ($socialUser->getAvatar() && !$user->avatar) {
                    $user->avatar = $socialUser->getAvatar();
                }
                if ($socialUser->getId() && !$user->provider_id) {
                    $user->provider_id = (string) $socialUser->getId();
                }
                $user->last_login_at = now();
                $user->save();
            }

            // ── Security: Reject banned users ──────────────────────────────────
            if ($user->is_banned) {
                return redirect()->away($frontendUrl . '/login?error=banned');
            }

            // ── Sync ADMIN_EMAIL on login ────────────────────────────────────
            if ($user->isOwnerOrSuperAdmin() && $user->role !== 'admin') {
                $user->role = 'admin';
                $user->save();
            }

            $token = $user->createToken('auth_token')->plainTextToken;

            // Chuyển hướng về frontend kèm token
            return redirect()->away($frontendUrl . '/auth/callback?token=' . $token);
            
        } catch (\Throwable $e) {
            \Log::error('OAuth login failed: ' . $e->getMessage() . "\n" . $e->getTraceAsString());

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Đăng nhập dịch vụ ngoài thất bại. Vui lòng thử lại.'
                ], 400);
            }

            return redirect()->away($frontendUrl . '/login?error=oauth_failed');
        }
    }
}
