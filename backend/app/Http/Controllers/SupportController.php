<?php

namespace App\Http\Controllers;

use App\Models\SupportTicket;
use App\Models\SupportMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class SupportController extends Controller
{
    public function myTickets(Request $request)
    {
        $tickets = SupportTicket::with('user')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($tickets);
    }

    public function create(Request $request)
    {
        $data = $request->validate([
            'subject' => 'required|string|max:255',
            'category' => 'nullable|string|max:100',
            'priority' => 'nullable|in:low,normal,high',
            'message' => 'required|string',
        ]);

        $ticket = SupportTicket::create([
            'user_id' => $request->user()->id,
            'subject' => $data['subject'],
            'category' => $data['category'] ?? 'general',
            'priority' => $data['priority'] ?? 'normal',
            'status' => 'open',
            'is_admin_seen' => false,
        ]);

        SupportMessage::create([
            'ticket_id' => $ticket->id,
            'user_id' => $request->user()->id,
            'message' => $data['message'],
            'is_admin' => false,
            'is_user_seen' => true,
            'is_admin_seen' => false,
        ]);

        $ticket->update(['is_admin_seen' => false]);
        $ticket->touch();

        return response()->json($ticket, 201);
    }

    public function guestCreate(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:30',
            'message' => 'required|string',
        ]);

        $subjectBase = "Guest Support - {$data['name']}";
        $subject = Str::limit($subjectBase, 255, '');

        $ticket = SupportTicket::create([
            'user_id' => null,
            'guest_name' => $data['name'],
            'guest_email' => $data['email'],
            'guest_phone' => $data['phone'] ?? null,
            'subject' => $subject,
            'category' => 'guest_support',
            'priority' => 'normal',
            'status' => 'open',
            'is_admin_seen' => false,
        ]);

        SupportMessage::create([
            'ticket_id' => $ticket->id,
            'user_id' => null,
            'message' => $data['message'],
            'is_admin' => false,
            'is_user_seen' => true,
            'is_admin_seen' => false,
        ]);

        $ticket->touch();

        Mail::raw(
            "New guest support message\n\nName: {$data['name']}\nEmail: {$data['email']}\nPhone: " .
                ($data['phone'] ?? '-') .
                "\n\nMessage:\n{$data['message']}\n",
            function ($message) use ($data) {
                $message->to('sushiltimalsina06@gmail.com')
                    ->replyTo($data['email'], $data['name'])
                    ->subject('New Guest Support Message');
            }
        );

        return response()->json(['message' => 'Contact request submitted.'], 201);
    }

    public function show(Request $request, SupportTicket $ticket)
    {
        if ($ticket->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $ticket->load(['user', 'messages' => function ($query) {
            $query->orderBy('created_at');
        }]);

        SupportMessage::where('ticket_id', $ticket->id)
            ->where('is_admin', true)
            ->update(['is_user_seen' => true]);

        return response()->json($ticket);
    }

    public function reply(Request $request, SupportTicket $ticket)
    {
        if ($ticket->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'message' => 'required|string',
        ]);

        SupportMessage::create([
            'ticket_id' => $ticket->id,
            'user_id' => $request->user()->id,
            'message' => $data['message'],
            'is_admin' => false,
            'is_user_seen' => true,
            'is_admin_seen' => false,
        ]);

        $ticket->update(['is_admin_seen' => false]);
        $ticket->touch();

        return response()->json(['message' => 'Reply sent']);
    }

    public function markSeen(Request $request, SupportTicket $ticket)
    {
        if ($ticket->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        SupportMessage::where('ticket_id', $ticket->id)
            ->where('is_admin', true)
            ->update(['is_user_seen' => true]);

        return response()->json(['message' => 'Messages marked as seen']);
    }

    public function unreadCount(Request $request)
    {
        $userId = $request->user()->id;

        $baseQuery = SupportMessage::where('is_admin', true)
            ->where('is_user_seen', false)
            ->whereHas('ticket', function ($query) use ($userId) {
                $query->where('user_id', $userId)
                    ->where('status', '!=', 'closed');
            });

        $latest = $baseQuery->orderByDesc('created_at')->first();

        return response()->json([
            'count' => $baseQuery->count(),
            'latest_unread_at' => $latest?->created_at,
            'latest_unread_message' => $latest?->message,
            'latest_unread_ticket_id' => $latest?->ticket_id,
        ]);
    }
}
