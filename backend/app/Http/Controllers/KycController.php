<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\KycDocument;
use App\Models\SupportTicket;
use App\Models\SupportMessage;
use App\Models\Notification;
use App\Mail\KycApprovedMail;
use App\Mail\KycRejectedMail;
use Illuminate\Support\Facades\Auth;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Mail;

class KycController extends Controller
{
    public function __construct(private NotificationService $notifier)
    {
    }

    public function submit(Request $request)
    {
        $user = Auth::user();

        // Prevent multiple pending KYC
        $existing = KycDocument::where('user_id', $user->id)
                    ->where('status', 'pending')
                    ->latest()
                    ->first();

        $editPending = $request->boolean('edit_pending');

        $latest = KycDocument::where('user_id', $user->id)->latest()->first();
        $editableApproved = $latest && $latest->status === 'approved' && $latest->allow_edit ? $latest : null;
        $editApproved = (bool) $editableApproved;
        $editableRejected = $latest && $latest->status === 'rejected' ? $latest : null;
        $editRejected = (bool) $editableRejected;

        if ($existing && !$editPending) {
            return response()->json([
                'success' => false,
                'message' => 'You already have a pending KYC.'
            ], 422);
        }
        if (!$existing && !$editApproved && !$editRejected && $latest && $latest->status === 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'Your KYC is approved and locked.'
            ], 422);
        }

        $rules = [
            'document_type'   => 'required|string|in:citizenship,license,passport',
            'document_number' => 'nullable|string',
            'front' => 'required|file|mimes:jpg,jpeg,png|max:5120',
            'back' => 'nullable|file|mimes:jpg,jpeg,png|max:5120',
            'full_name' => ['nullable', 'string', 'min:2', 'max:255', 'regex:/^[A-Za-z\\s]+$/'],
            'dob' => 'nullable|date',
            'address' => 'nullable|string|min:5|max:255',
            'province' => 'nullable|string',
            'district' => 'nullable|string',
            'municipality_type' => 'nullable|string',
            'municipality_name' => 'nullable|string',
            'ward_number' => 'nullable|string',
            'street_address' => 'nullable|string',
            'phone' => 'nullable|string|max:50',
            'family_members' => 'nullable',
        ];
        if (($existing && $editPending) || $editApproved || $editRejected) {
            $rules['front'] = 'nullable|file|mimes:jpg,jpeg,png|max:5120';
            $rules['back'] = 'nullable|file|mimes:jpg,jpeg,png|max:5120';
        }
        $request->validate($rules);

        $docType = strtolower($request->document_type);
        $frontDir = 'kyc/' . $docType;
        $backDir = null;
        if ($docType === 'citizenship') {
            $frontDir = 'kyc/citizenship/front';
            $backDir = 'kyc/citizenship/back';
        }

        $editingTarget = $existing && $editPending
            ? $existing
            : ($editApproved ? $editableApproved : $editableRejected);

        $frontPath = $editingTarget?->front_path;
        if ($request->hasFile('front')) {
            $frontPath = $request->file('front')->store($frontDir, 'public');
        }

        $backPath = $editingTarget?->back_path;
        if ($docType === 'citizenship') {
            if ($request->hasFile('back')) {
                $backPath = $request->file('back')->store($backDir, 'public');
            }
        } else {
            $backPath = null;
        }

        $familyMembers = $request->input('family_members');
        if (is_string($familyMembers)) {
            $decoded = json_decode($familyMembers, true);
            $familyMembers = is_array($decoded) ? $decoded : null;
        } elseif (!is_array($familyMembers)) {
            $familyMembers = null;
        }
        if (is_array($familyMembers)) {
            foreach ($familyMembers as $member) {
                $name = isset($member['name']) ? trim((string) $member['name']) : '';
                if ($name === '' || strlen($name) < 2 || !preg_match('/^[A-Za-z\\s]+$/', $name)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Family member names must be at least 2 characters and contain only letters and spaces.'
                    ], 422);
                }
            }
        }

        if (!empty($request->document_number)) {
            $duplicateQuery = KycDocument::where('document_number', $request->document_number)
                ->where('user_id', '!=', $user->id);
            $duplicate = $duplicateQuery->exists();
            $userHasSame = KycDocument::where('document_number', $request->document_number)
                ->where('user_id', $user->id)
                ->exists();
            if ($duplicate && !$userHasSame) {
                return response()->json([
                    'success' => false,
                    'message' => 'This document number is already in use.'
                ], 422);
            }
        }

        $payload = [
            'user_id' => $user->id,
            'full_name' => $request->full_name ?? $user->name,
            'dob' => $request->dob ?? $user->dob,
            'address' => $request->address ?? $user->address,
            'province' => $request->province ?? $user->province,
            'district' => $request->district ?? $user->district,
            'municipality_type' => $request->municipality_type ?? $user->municipality_type,
            'municipality_name' => $request->municipality_name ?? $user->municipality_name,
            'ward_number' => $request->ward_number ?? $user->ward_number,
            'street_address' => $request->street_address ?? $user->street_address,
            'phone' => $request->phone ?? $user->phone,
            'document_type' => $request->document_type,
            'document_number' => $request->document_number,
            'front_path' => $frontPath,
            'back_path' => $backPath,
            'family_members' => $familyMembers,
            'status' => 'pending',
            'allow_edit' => false,
            'remarks' => null,
            'verified_at' => null,
        ];

        if (($existing && $editPending) || $editApproved || $editRejected) {
            $editingTarget->update($payload);
            $kyc = $editingTarget->fresh();
        } else {
            $kyc = KycDocument::create($payload);
        }

        $userUpdates = [
            'name' => $payload['full_name'] ?? $user->name,
            'phone' => $payload['phone'] ?? $user->phone,
            'address' => $payload['address'] ?? $user->address,
        ];
        if ($request->filled('dob')) {
            $userUpdates['dob'] = $payload['dob'] ?? $user->dob;
        }
        
        // Sync structured address
        $userUpdates['province'] = $payload['province'];
        $userUpdates['district'] = $payload['district'];
        $userUpdates['municipality_type'] = $payload['municipality_type'];
        $userUpdates['municipality_name'] = $payload['municipality_name'];
        $userUpdates['ward_number'] = $payload['ward_number'];
        $userUpdates['street_address'] = $payload['street_address'];
        
        // Auto-calculate Region Type
        $muniType = $payload['municipality_type'];
        $regionType = 'urban';
        if ($muniType === 'rural_municipality') {
            $regionType = 'rural';
        } elseif ($muniType === 'municipality') {
            $regionType = 'semi_urban';
        }
        $userUpdates['region_type'] = $regionType;
        
        // Sync generic address for backward compat
        if ($payload['province'] || $payload['district'] || $payload['municipality_name']) {
             $fullAddressItems = array_filter([
                $payload['street_address'] ?? null,
                ($payload['municipality_name'] ?? '') . ($payload['ward_number'] ? '-' . $payload['ward_number'] : ''),
                $payload['district'] ?? null,
                $payload['province'] ?? null
            ]);
            $userUpdates['address'] = implode(', ', $fullAddressItems);
        }
        if (is_array($familyMembers)) {
            $userUpdates['family_member_details'] = $familyMembers;
            $userUpdates['family_members'] = max(1, count($familyMembers));
        }
        if (!empty($userUpdates)) {
            try {
                $user->update($userUpdates);
            } catch (\Throwable $e) {
                // ignore profile sync errors
            }
        }

        if (($existing && $editPending) || $editApproved) {
            $ticket = SupportTicket::where('user_id', $user->id)
                ->whereIn('category', ['kyc_update', 'kyc update'])
                ->latest()
                ->first();
            if ($ticket) {
                SupportMessage::create([
                    'ticket_id' => $ticket->id,
                    'user_id' => $user->id,
                    'message' => 'KYC resubmitted. Please review.',
                    'is_admin' => false,
                ]);
                $ticket->update([
                    'status' => 'open',
                    'is_admin_seen' => false,
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => ($existing && $editPending) || $editApproved || $editRejected
                ? 'KYC updated successfully.'
                : 'KYC submitted successfully.',
            'data' => $kyc
        ]);
    }


    public function myKyc()
    {
        $base = request()->root();
        $records = KycDocument::where('user_id', Auth::id())
            ->latest()
            ->get()
            ->map(function ($kyc) use ($base) {
                $frontUrl = $kyc->front_path
                    ? $base . '/storage/' . ltrim($kyc->front_path, '/')
                    : null;
                $backUrl = $kyc->back_path
                    ? $base . '/storage/' . ltrim($kyc->back_path, '/')
                    : null;
                return array_merge($kyc->toArray(), [
                    'front_image_url' => $frontUrl,
                    'back_image_url' => $backUrl,
                ]);
            });

        return response()->json([
            'success' => true,
            'data' => $records
        ]);
    }


    public function index(Request $request)
    {
        $status = $request->query('status');

        $query = KycDocument::with('user')->latest();

        if ($status && in_array($status, ['pending', 'approved', 'rejected'])) {
            $query->where('status', $status);
        }

        return response()->json([
            'success' => true,
            'data' => $query->get()
        ]);
    }


    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected',
            'remarks' => 'required_if:status,rejected|nullable|string'
        ]);

        $kyc = KycDocument::findOrFail($id);

        if ($kyc->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'This KYC is already finalized.'
            ], 422);
        }

        $kyc->status = $request->status;
        $kyc->remarks = $request->remarks;
        $kyc->allow_edit = false;
        $kyc->verified_at = now();
        $kyc->save();

        // Notify user about verification result (in-app + template email)
        $kyc->loadMissing('user');
        if ($kyc->user) {
            $title = $kyc->status === 'approved'
                ? 'KYC Approved'
                : 'KYC Rejected';

            $msg = $kyc->status === 'approved'
                ? 'Your KYC has been verified. You can now continue with purchases.'
                : 'Your KYC was rejected. Please review the remarks and resubmit.';

            if ($kyc->remarks) {
                $msg .= ' Remarks: ' . $kyc->remarks;
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
                    if ($kyc->status === 'approved') {
                        Mail::to($kyc->user->email)->send(new KycApprovedMail($kyc->user));
                    } else {
                        Mail::to($kyc->user->email)->send(new KycRejectedMail($kyc->user, $kyc->remarks));
                    }
                } catch (\Throwable $e) {
                    // ignore email failures
                }
            }
        }

        if (in_array($kyc->status, ['approved', 'rejected'], true)) {
            $ticket = SupportTicket::where('user_id', $kyc->user_id)
                ->whereIn('category', ['kyc_update', 'kyc update'])
                ->latest()
                ->first();
            if ($ticket) {
                $message = $kyc->status === 'approved'
                    ? 'KYC update approved. Your updated details are verified.'
                    : 'KYC update rejected.' . (!empty($kyc->remarks) ? ' Remarks: ' . $kyc->remarks : '');
                SupportMessage::create([
                    'ticket_id' => $ticket->id,
                    'admin_id' => auth()->id(),
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

        return response()->json([
            'success' => true,
            'message' => 'KYC status updated.',
            'data' => $kyc
        ]);
    }
}
