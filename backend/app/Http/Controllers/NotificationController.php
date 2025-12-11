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
