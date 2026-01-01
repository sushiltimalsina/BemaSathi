<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\KycDocument;
use Illuminate\Support\Facades\Auth;
use App\Services\NotificationService;

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

        if ($existing && !$editPending) {
            return response()->json([
                'success' => false,
                'message' => 'You already have a pending KYC.'
            ], 422);
        }

        $rules = [
            'document_type'   => 'required|string|in:citizenship,license,passport',
            'document_number' => 'nullable|string',
            'front' => 'required|file|mimes:jpg,jpeg,png|max:5120',
            'back' => 'nullable|file|mimes:jpg,jpeg,png|max:5120',
            'full_name' => 'nullable|string|max:255',
            'dob' => 'nullable|date',
            'address' => 'nullable|string|max:500',
            'phone' => 'nullable|string|max:50',
            'family_members' => 'nullable',
        ];
        if ($existing && $editPending) {
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

        $frontPath = $existing?->front_path;
        if ($request->hasFile('front')) {
            $frontPath = $request->file('front')->store($frontDir, 'public');
        }

        $backPath = $existing?->back_path;
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

        $payload = [
            'user_id' => $user->id,
            'full_name' => $request->full_name ?? $user->name,
            'dob' => $request->dob ?? $user->dob,
            'address' => $request->address ?? $user->address,
            'phone' => $request->phone ?? $user->phone,
            'document_type' => $request->document_type,
            'document_number' => $request->document_number,
            'front_path' => $frontPath,
            'back_path' => $backPath,
            'family_members' => $familyMembers,
            'status' => 'pending',
            'remarks' => null,
            'verified_at' => null,
        ];

        if ($existing && $editPending) {
            $existing->update($payload);
            $kyc = $existing->fresh();
        } else {
            $kyc = KycDocument::create($payload);
        }

        return response()->json([
            'success' => true,
            'message' => $existing && $editPending
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
            'remarks' => 'nullable|string'
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
        $kyc->verified_at = now();
        $kyc->save();

        // Notify user about verification result (with email if available)
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

            $this->notifier->notify($kyc->user, $title, $msg, []);
        }

        return response()->json([
            'success' => true,
            'message' => 'KYC status updated.',
            'data' => $kyc
        ]);
    }
}
