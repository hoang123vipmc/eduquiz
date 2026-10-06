<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    /**
     * Get user notifications
     */
    public function index(Request $request)
    {
        $notifications = Notification::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->take(20)
            ->get();

        $unreadCount = Notification::where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'notifications' => $notifications,
                'unread_count' => $unreadCount
            ]
        ]);
    }

    /**
     * Mark specific or all notifications as read
     */
    public function markAsRead(Request $request)
    {
        $query = Notification::where('user_id', $request->user()->id)
            ->where('is_read', false);

        if ($request->has('notification_id')) {
            $query->where('id', $request->notification_id);
        }

        $query->update(['is_read' => true]);

        return response()->json(['success' => true]);
    }

    // ── Admin routes ──

    /**
     * Admin: Create a new notification for all users
     */
    public function storeGlobal(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'type' => 'required|string|in:feature,update,system',
        ]);

        // Insert notification for all active users (prevent timing out on large DBs by chunking if necessary)
        // For simplicity, we just insert for all users.
        $userIds = User::pluck('id');
        $notifications = [];
        $now = now();
        
        foreach ($userIds as $id) {
            $notifications[] = [
                'user_id' => $id,
                'title' => $request->title,
                'message' => $request->message,
                'type' => $request->type,
                'is_read' => false,
                'created_at' => $now
            ];
        }

        foreach (array_chunk($notifications, 500) as $chunk) {
            Notification::insert($chunk);
        }

        return response()->json([
            'success' => true,
            'message' => 'Đã gửi thông báo đến ' . count($userIds) . ' người dùng.'
        ]);
    }

    /**
     * Admin: Get all notifications history
     */
    public function adminIndex(Request $request)
    {
        // To show history of global announcements. 
        // We can just query distinct title/messages to infer announcements.
        // For simplicity, we fetch unique recent notifications.
        $announcements = Notification::select('title', 'message', 'type', 'created_at')
            ->groupBy('title', 'message', 'type', 'created_at')
            ->orderBy('created_at', 'desc')
            ->take(50)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $announcements
        ]);
    }
}
