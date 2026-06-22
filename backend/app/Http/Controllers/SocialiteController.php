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
    public function redirect($provider)
    {
        return response()->json([
            'url' => Socialite::driver($provider)->stateless()->redirect()->getTargetUrl()
        ]);
    }

    public function callback($provider)
    {
        try {
            $socialUser = Socialite::driver($provider)->stateless()->user();
            
            $user = User::where('email', $socialUser->getEmail())->first();

            if (!$user) {
                $user = User::create([
                    'name' => $socialUser->getName() ?? $socialUser->getNickname(),
                    'email' => $socialUser->getEmail(),
                    'password' => Hash::make(Str::random(24)),
                    'avatar' => $socialUser->getAvatar(),
                ]);
            }

            $token = $user->createToken('auth_token')->plainTextToken;

            // Chuyển hướng về frontend kèm token (ví dụ: http://localhost:3000/auth/callback?token=xxx)
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
            return redirect()->to($frontendUrl . '/auth/callback?token=' . $token);
            
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Đăng nhập thất bại.'], 400);
        }
    }
}
