<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\KycDocument;
use Illuminate\Http\Request;

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
        ]);
    }

    public function updateKycStatus(Request $request, User $user)
    {
        $data = $request->validate([
            'status' => 'required|in:approved,rejected,pending',
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

        $kyc->update(['status' => $data['status'], 'allow_edit' => false]);

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

        $kyc->update(['allow_edit' => true]);

        return response()->json([
            'message' => 'KYC edit access granted.',
            'kyc' => $kyc
        ]);
    }
}
