<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\KycDocument;
use App\Models\SupportTicket;
use App\Models\SupportMessage;
use App\Models\Notification;
use App\Mail\KycApprovedMail;
use App\Mail\KycRejectedMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class AdminUserController extends Controller
{
    public function index()
    {
        $users = User::with('kycDocuments')
            ->select('id', 'name', 'email', 'phone', 'created_at')
            ->get()
            ->map(function ($user) {
                $latestKyc = $user->kycDocuments()->latest()->first();
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'created_at' => $user->created_at,
                    'kyc_status' => $latestKyc?->status ?? 'pending',
                    'allow_edit' => (bool) ($latestKyc?->allow_edit ?? false),
                ];
            });

        return response()->json($users);
    }

    public function kyc(User $user)
    {
        $kyc = $user->kycDocuments()->latest()->first();
        if (!$kyc) {
            return response()->json(['message' => 'KYC not found'], 404);
        }

        $base = request()->root();
        $frontUrl = $kyc->front_path ? $base . '/storage/' . ltrim($kyc->front_path, '/') : null;
        $backUrl = $kyc->back_path ? $base . '/storage/' . ltrim($kyc->back_path, '/') : null;
        $hasKycUpdateRequest = SupportTicket::where('user_id', $user->id)
            ->whereIn('category', ['kyc_update', 'kyc update'])
            ->whereIn('status', ['open', 'in_progress'])
            ->exists();

        return response()->json([
            'id' => $kyc->id,
            'user_id' => $kyc->user_id,
            'full_name' => $kyc->full_name,
            'dob' => $kyc->dob,
            'address' => $kyc->address,
            'phone' => $kyc->phone,
            'document_type' => $kyc->document_type,
            'document_number' => $kyc->document_number,
            'family_members' => $kyc->family_members,
            'status' => $kyc->status,
            'allow_edit' => $kyc->allow_edit,
            'remarks' => $kyc->remarks,
            'verified_at' => $kyc->verified_at,
            'front_path' => $kyc->front_path,
            'back_path' => $kyc->back_path,
            'front_image' => $frontUrl,
            'back_image' => $backUrl,
            'main_image' => $frontUrl,
            'has_kyc_update_request' => $hasKycUpdateRequest,
        ]);
    }

    public function updateKycStatus(Request $request, User $user)
    {
        $data = $request->validate([
            'status' => 'required|in:approved,rejected,pending',
            'remarks' => 'required_if:status,rejected|nullable|string',
        ]);

        $kyc = $user->kycDocuments()->latest()->first();
        if (!$kyc) {
            return response()->json(['message' => 'KYC not found'], 404);
        }

        if ($kyc->status !== 'pending') {
            return response()->json([
                'message' => 'KYC already finalized. User must resubmit.',
            ], 422);
        }

        $kyc->update([
            'status' => $data['status'],
            'allow_edit' => false,
            'remarks' => $data['remarks'] ?? null,
        ]);

        $kyc->loadMissing('user');
        if ($kyc->user) {
            $title = $data['status'] === 'approved'
                ? 'KYC Approved'
                : 'KYC Rejected';
            $msg = $data['status'] === 'approved'
                ? 'Your KYC has been verified. You can now continue with purchases.'
                : 'Your KYC was rejected. Please review the remarks and resubmit.';
            if (!empty($data['remarks'])) {
                $msg .= ' Remarks: ' . $data['remarks'];
            }

            Notification::create([
                'user_id' => $kyc->user->id,
                'title' => $title,
                'message' => $msg,
                'is_read' => false,
                'type' => 'system',
            ]);

            if ($kyc->user->email) {
                try {
                    if ($data['status'] === 'approved') {
                        Mail::to($kyc->user->email)->send(new KycApprovedMail($kyc->user));
                    } else {
                        Mail::to($kyc->user->email)->send(new KycRejectedMail($kyc->user, $data['remarks'] ?? null));
                    }
                } catch (\Throwable $e) {
                    // ignore email failures
                }
            }
        }

        if (in_array($data['status'], ['approved', 'rejected'], true)) {
            $ticket = SupportTicket::where('user_id', $user->id)
                ->whereIn('category', ['kyc_update', 'kyc update'])
                ->latest()
                ->first();
            if ($ticket) {
                $message = $data['status'] === 'approved'
                    ? 'KYC update approved. Your updated details are verified.'
                    : 'KYC update rejected.' . (!empty($data['remarks']) ? ' Remarks: ' . $data['remarks'] : '');
                SupportMessage::create([
                    'ticket_id' => $ticket->id,
                    'admin_id' => $request->user()?->id,
                    'message' => $message,
                    'is_admin' => true,
                    'is_user_seen' => false,
                ]);
                $ticket->update([
                    'status' => 'closed',
                    'is_admin_seen' => true,
                ]);
            }
        }

        return response()->json(['message' => 'KYC updated', 'kyc' => $kyc]);
    }

    public function allowKycEdit(User $user)
    {
        $kyc = $user->kycDocuments()->latest()->first();
        if (!$kyc) {
            return response()->json(['message' => 'KYC not found'], 404);
        }

        if ($kyc->status !== 'approved') {
            return response()->json([
                'message' => 'Only approved KYC can be reopened for edits.',
            ], 422);
        }

        $hasRequest = SupportTicket::where('user_id', $user->id)
            ->whereIn('category', ['kyc_update', 'kyc update'])
            ->exists();
        if (!$hasRequest) {
            return response()->json([
                'message' => 'User must request a KYC update via support before edit access can be granted.',
            ], 422);
        }

        $kyc->update(['allow_edit' => true]);

        $ticket = SupportTicket::where('user_id', $user->id)
            ->whereIn('category', ['kyc_update', 'kyc update'])
            ->latest()
            ->first();
        if ($ticket) {
            SupportMessage::create([
                'ticket_id' => $ticket->id,
                'admin_id' => auth()->id(),
                'message' => 'Admin granted KYC update access. Please update and resubmit.',
                'is_admin' => true,
                'is_user_seen' => false,
            ]);
            $ticket->update(['is_admin_seen' => true]);
            $ticket->touch();
        }

        return response()->json([
            'message' => 'KYC edit access granted.',
            'kyc' => $kyc
        ]);
    }
}
