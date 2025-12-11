<?php

namespace App\Http\Controllers;

use App\Models\PurchaseRequest;
use Illuminate\Http\Request;

class BuyController extends Controller
{
    public function buy(Request $request)
    {
        if (!$request->user()) {
            return response()->json([
                'message' => 'Authentication required.'
            ], 401);
        }

        $validated = $request->validate([
            'policy_id' => 'required|exists:policies,id',
            'name'      => 'required|string|max:255',
            'phone'     => 'required|string|max:30',
            'email'     => 'nullable|email|max:255',
        ]);

        // Prevent spam submissions
        $existing = PurchaseRequest::where('policy_id', $validated['policy_id'])
            ->where('user_id', $request->user()->id)
            ->where('created_at', '>=', now()->subMinutes(5))
            ->exists();

        if ($existing) {
            return response()->json([
                "message" => "You already submitted this request recently."
            ], 429);
        }

        PurchaseRequest::create([
            'policy_id' => $validated['policy_id'],
            'user_id'   => $request->user()->id,
            'name'      => $validated['name'],
            'phone'     => $validated['phone'],
            'email'     => $validated['email'],
        ]);

        return response()->json([
            "success" => true,
            "message" => "Your request has been recorded. Our team will contact you shortly."
        ]);
    }
}
