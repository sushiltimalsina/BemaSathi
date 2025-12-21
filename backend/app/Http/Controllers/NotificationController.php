<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;


class NotificationController extends Controller
{
    // Fetch notifications for client
    public function index()
    {
        $user = auth()->user();
        return Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    // Mark as read
    public function markRead($id)
    {
        $n = Notification::where('user_id', auth()->id())->findOrFail($id);
        $n->update(['is_read' => true]);
        return response()->json(['message' => 'Marked as read']);
    }

    // Mark all notifications as read for the authenticated user
    public function markAllRead(Request $request)
    {
        Notification::where('user_id', $request->user()?->id)
            ->where(function ($q) {
                $q->whereNull('is_read')->orWhere('is_read', false);
            })
            ->update(['is_read' => true]);

        return response()->json(['message' => 'All notifications marked as read']);
    }

    // Clear all notifications for the authenticated user
    public function clearAll(Request $request)
    {
        $userId = $request->user()?->id;

        if (!$userId) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        Notification::where('user_id', $userId)->delete();

        return response()->json(['message' => 'All notifications cleared']);
    }

    // Admin creates manual notifications
    public function adminCreate(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:clients,id',
            'title' => 'required',
            'message' => 'nullable',
        ]);

        Notification::create($request->all());

        return response()->json(['message' => 'Notification sent']);
    }
}
