<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class AdminNotificationController extends Controller
{
    private NotificationService $notifier;

    public function __construct(NotificationService $notifier)
    {
        $this->notifier = $notifier;
    }

    public function index()
    {
        $notifications = Notification::with('user')
            ->orderByDesc('created_at')
            ->limit(200)
            ->get();

        return response()->json($notifications);
    }

    public function send(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string',
            'message' => 'required|string',
            'user_id' => 'nullable|exists:users,id',
        ]);

        if (!empty($data['user_id'])) {
            $user = User::find($data['user_id']);
            $this->notifier->notify($user, $data['title'], $data['message'], [], 'manual');
            return response()->json(['message' => 'Notification sent']);
        }

        // Broadcast to all users
        $users = User::all();
        foreach ($users as $user) {
            $this->notifier->notify($user, $data['title'], $data['message'], [], 'manual');
        }

        return response()->json(['message' => 'Notifications sent']);
    }
}
