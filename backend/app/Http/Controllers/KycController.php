<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\KycDocument;
use Illuminate\Support\Facades\Auth;

class KycController extends Controller
{
    public function submit(Request $request)
    {
        $user = Auth::user();

        // Prevent multiple pending KYC
        $existing = KycDocument::where('user_id', $user->id)
                    ->where('status', 'pending')
                    ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'You already have a pending KYC.'
            ], 422);
        }

        $request->validate([
            'document_type'   => 'required|string',
            'document_number' => 'nullable|string',
            'front' => 'required|file|mimes:jpg,jpeg,png|max:5120',
            'back' => 'nullable|file|mimes:jpg,jpeg,png|max:5120',
            'full_name' => 'nullable|string|max:255',
            'dob' => 'nullable|date',
            'address' => 'nullable|string|max:500',
            'phone' => 'nullable|string|max:50',
        ]);

        $frontPath = $request->file('front')->store('kyc/front', 'public');
        $backPath  = $request->file('back')?->store('kyc/back', 'public');

        $kyc = KycDocument::create([
            'user_id' => $user->id,
            'full_name' => $request->full_name ?? $user->name,
            'dob' => $request->dob ?? $user->dob,
            'address' => $request->address ?? $user->address,
            'phone' => $request->phone ?? $user->phone,
            'document_type' => $request->document_type,
            'document_number' => $request->document_number,
            'front_path' => $frontPath,
            'back_path' => $backPath,
            'status' => 'pending'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'KYC submitted successfully.',
            'data' => $kyc
        ]);
    }


    public function myKyc()
    {
        return response()->json([
            'success' => true,
            'data' => KycDocument::where('user_id', Auth::id())->latest()->get()
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

        return response()->json([
            'success' => true,
            'message' => 'KYC status updated.',
            'data' => $kyc
        ]);
    }
}
