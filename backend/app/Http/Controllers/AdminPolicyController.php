<?php

namespace App\Http\Controllers;

use App\Models\Policy;
use Illuminate\Http\Request;

class AdminPolicyController extends Controller
{
    // List all policies
    public function index()
    {
        return Policy::all();
    }

    // Create a new policy
    public function store(Request $request)
    {
        $request->validate([
            'insurance_type' => 'required|string',
            'company_name' => 'required|string',
            'policy_name' => 'required|string|max:255',
            'premium_amt' => 'required|numeric',
            'coverage_limit' => 'required|numeric',
            'policy_description' => 'required|string',
            'company_rating' => 'required|numeric|min:1|max:5',
            'agent_id' => 'nullable|integer',
            'waiting_period_days' => 'required|integer|min:0',
            'copay_percent' => 'required|integer|min:0|max:100',
            'exclusions' => 'nullable|array',
            'exclusions.*' => 'string',
            'claim_settlement_ratio' => 'required|numeric|min:0|max:100',


        ]);

$policy = Policy::create([
    'insurance_type' => $request->insurance_type,
    'company_name' => $request->company_name,
    'policy_name' => $request->policy_name,
    'premium_amt' => $request->premium_amt,
    'coverage_limit' => $request->coverage_limit,
    'policy_description' => $request->policy_description,
    'company_rating' => $request->company_rating,
    'agent_id' => $request->agent_id,
    'waiting_period_days' => $request->waiting_period_days,
    'copay_percent' => $request->copay_percent,
    'exclusions' => $request->exclusions,
    'claim_settlement_ratio' => $request->claim_settlement_ratio,
]);

        return response()->json([
            'message' => 'Policy created successfully',
            'policy' => $policy
        ]);
    }

    // Show one policy
    public function show($id)
    {
        $policy = Policy::find($id);

        if (! $policy) {
            return response()->json(['message' => 'Policy not found'], 404);
        }

        return $policy;
    }

    // Update policy
    public function update(Request $request, $id)
    {
        $policy = Policy::find($id);

        if (! $policy) {
            return response()->json(['message' => 'Policy not found'], 404);
        }

        $validated = $request->validate([
            'insurance_type' => 'sometimes|string',
            'company_name' => 'sometimes|string',
            'policy_name' => 'sometimes|string|max:255',
            'premium_amt' => 'sometimes|numeric',
            'coverage_limit' => 'sometimes|numeric',
            'policy_description' => 'sometimes|string',
            'company_rating' => 'sometimes|numeric|min:1|max:5',
            'agent_id' => 'nullable|integer',
            'waiting_period_days' => 'sometimes|integer|min:0',
            'copay_percent' => 'required|integer|min:0|max:100',
            'exclusions' => 'nullable|array',
            'exclusions.*' => 'string',
            'claim_settlement_ratio' => 'required|numeric|min:0|max:100',

        ]);

        $policy->update($validated);

        return response()->json([
            'message' => 'Policy updated successfully',
            'policy' => $policy
        ]);
    }

    // Delete policy
    public function destroy($id)
    {
        $policy = Policy::find($id);

        if (! $policy) {
            return response()->json(['message' => 'Policy not found'], 404);
        }

        $policy->delete();

        return response()->json([
            'message' => 'Policy deleted successfully'
        ]);
    }
}
