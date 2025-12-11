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
        // Load buy requests with related policy, client, and agent (if assigned)
        $requests = BuyRequest::with(['policy', 'user', 'agent'])->latest()->get();
        return BuyRequest::with('policy', 'agent')
        ->orderBy('created_at', 'desc')
        ->get();
    }

    public function show(BuyRequest $buyRequest)
    {
        $buyRequest->load(['policy', 'user', 'agent']);
        return response()->json($buyRequest);
    }

    public function update(BuyRequest $buyRequest, Request $request)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,processing,assigned,completed,rejected',
            'agent_id' => 'nullable|exists:agents,id',
        ]);

        $buyRequest->update($validated);

        // Notify client about status/assignment changes
        Notification::create([
            'user_id' => $buyRequest->user_id,
            'title' => 'Request Updated',
            'message' => "Your request status is now: {$validated['status']}" .
                (!empty($validated['agent_id']) ? ' (agent assigned).' : '.'),
            'buy_request_id' => $buyRequest->id,
            'policy_id' => $buyRequest->policy_id,
        ]);

        return response()->json([
            'message'    => 'Buy request updated successfully',
            'buyRequest' => $buyRequest->fresh(['policy','user','agent']),
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
