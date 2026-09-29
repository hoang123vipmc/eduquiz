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
        $targetUrl = Socialite::driver($provider)->stateless()->redirect()->getTargetUrl();

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'url' => $targetUrl
            ]);
        }

        return redirect()->away($targetUrl);
    }

    public function callback($provider)
    {
        try {
            $socialUser = Socialite::driver($provider)->stateless()->user();
            
            $user = User::where('email', $socialUser->getEmail())->first();

            if (!$user) {
                $adminEmail = env('ADMIN_EMAIL');
                $role = ($adminEmail && strtolower($socialUser->getEmail()) === strtolower($adminEmail))
                    ? 'admin' : 'student';

                $user = User::create([
                    'name'     => $socialUser->getName() ?? $socialUser->getNickname(),
                    'email'    => $socialUser->getEmail(),
                    'password' => Hash::make(Str::random(24)),
                    'avatar'   => $socialUser->getAvatar(),
                    'role'     => $role,
                ]);
            }

            // ── Security: Reject banned users ──────────────────────────────────
            if ($user->is_banned) {
                $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
                return redirect()->to($frontendUrl . '/login?error=banned');
            }

            // ── Sync ADMIN_EMAIL on login ────────────────────────────────────
            $adminEmail = env('ADMIN_EMAIL');
            if ($adminEmail && strtolower($user->email) === strtolower($adminEmail) && $user->role !== 'admin') {
                $user->role = 'admin';
                $user->save();
            }

            $token = $user->createToken('auth_token')->plainTextToken;

            // Chuyển hướng về frontend kèm token
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
            return redirect()->to($frontendUrl . '/auth/callback?token=' . $token);
            
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Đăng nhập thất bại.'], 400);
        }
    }
}
