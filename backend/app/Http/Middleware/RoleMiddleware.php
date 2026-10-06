<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $role): Response
    {
        $user = $request->user();
        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn chưa đăng nhập.'
            ], 401);
        }

        $adminEmail = config('app.admin_email') ?: env('ADMIN_EMAIL');
        $isOwnerOrAdmin = ($adminEmail && strtolower($user->email) === strtolower($adminEmail))
            || strtolower($user->email) === 'hoangdeptraivodich12@gmail.com';

        if ($isOwnerOrAdmin && $role === 'admin') {
            return $next($request);
        }

        if (! in_array($user->role, explode('|', $role))) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền thực hiện hành động này.'
            ], 403);
        }

        return $next($request);
    }
}
