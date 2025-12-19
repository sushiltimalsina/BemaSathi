<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use App\Models\SupportMessage;
use Illuminate\Http\Request;

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
        ]);

        return response()->json(['message' => 'Reply sent']);
    }

    public function updateStatus(Request $request, SupportTicket $ticket)
    {
        $data = $request->validate([
            'status' => 'required|in:open,in_progress,resolved,closed',
        ]);

        $ticket->update(['status' => $data['status']]);

        return response()->json(['message' => 'Status updated', 'ticket' => $ticket]);
    }
}
