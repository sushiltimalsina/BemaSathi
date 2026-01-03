<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use App\Models\SupportMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminSupportController extends Controller
{
    public function index()
    {
        $tickets = SupportTicket::with('user')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($tickets);
    }

    public function show(SupportTicket $ticket)
    {
        $ticket->load(['user', 'messages' => function ($query) {
            $query->orderBy('created_at');
        }]);

        SupportMessage::where('ticket_id', $ticket->id)
            ->where('is_admin', false)
            ->update(['is_admin_seen' => true]);

        $ticket->update(['is_admin_seen' => true]);

        return response()->json($ticket);
    }

    public function reply(Request $request, SupportTicket $ticket)
    {
        $data = $request->validate([
            'message' => 'required|string',
        ]);

        SupportMessage::create([
            'ticket_id' => $ticket->id,
            'admin_id' => $request->user()?->id,
            'message' => $data['message'],
            'is_admin' => true,
            'is_user_seen' => false,
            'is_admin_seen' => true,
        ]);

        $ticket->update(['is_admin_seen' => true]);
        $ticket->touch();

        return response()->json(['message' => 'Reply sent']);
    }

    public function updateStatus(Request $request, SupportTicket $ticket)
    {
        $data = $request->validate([
            'status' => 'required|in:open,in_progress,resolved,closed',
        ]);

        $update = ['status' => $data['status']];
        if ($data['status'] === 'closed') {
            $update['is_admin_seen'] = true;
        }
        $ticket->update($update);

        return response()->json(['message' => 'Status updated', 'ticket' => $ticket]);
    }

    public function unreadCount()
    {
        $query = SupportTicket::where('is_admin_seen', false)
            ->where('status', '!=', 'closed');
        $count = $query->count();
        $latestTicket = $query->with('user')->orderByDesc('updated_at')->first();
        $latestMessage = null;
        if ($latestTicket) {
            $latestMessage = $latestTicket->messages()
                ->orderByDesc('created_at')
                ->value('message');
        }

        return response()->json([
            'count' => $count,
            'latest_unread_at' => $latestTicket?->updated_at,
            'latest_unread_user' => $latestTicket?->user?->name,
            'latest_unread_message' => $latestMessage,
        ]);
    }

    public function markSeen(SupportTicket $ticket)
    {
        SupportMessage::where('ticket_id', $ticket->id)
            ->where('is_admin', false)
            ->update(['is_admin_seen' => true]);
        $ticket->update(['is_admin_seen' => true]);
        return response()->json(['message' => 'Ticket marked as seen']);
    }
}
