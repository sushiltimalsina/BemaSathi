<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BuyRequest;
use App\Models\Notification;
use Illuminate\Http\Request;

class AdminBuyRequestController extends Controller
{
    public function index()
    {
        return BuyRequest::with(['policy', 'user'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function show(BuyRequest $buyRequest)
    {
        $buyRequest->load(['policy', 'user']);
        return response()->json($buyRequest);
    }

    public function update(BuyRequest $buyRequest, Request $request)
    {
        $validated = $request->validate([
            'billing_cycle' => 'nullable|in:monthly,quarterly,half_yearly,yearly',
            'cycle_amount' => 'nullable|numeric|min:0',
            'next_renewal_date' => 'nullable|date',
            'renewal_status' => 'nullable|in:active,due,expired',
        ]);

        $buyRequest->update(array_filter($validated, fn ($value) => $value !== null));

        // Notify client about updates (no agent assignment tracking)
        Notification::create([
            'user_id' => $buyRequest->user_id,
            'title' => 'Request Updated',
            'message' => 'Your request details were updated by the admin.',
            'buy_request_id' => $buyRequest->id,
            'policy_id' => $buyRequest->policy_id,
        ]);

        return response()->json([
            'message'    => 'Buy request updated successfully',
            'buyRequest' => $buyRequest->fresh(['policy','user']),
        ]);
    }

public function destroy(BuyRequest $buyRequest)
{
    $buyRequest->delete(); // SOFT DELETE

    return response()->json(['message' => 'Buy request moved to trash']);
}

public function trash()
{
    return BuyRequest::onlyTrashed()->get();
}

public function restore($id)
{
    BuyRequest::onlyTrashed()->where('id', $id)->restore();
    return response()->json(['message' => 'Buy request restored']);
}

public function forceDelete($id)
{
    BuyRequest::onlyTrashed()->where('id', $id)->forceDelete();
    return response()->json(['message' => 'Buy request permanently deleted']);
}

}
