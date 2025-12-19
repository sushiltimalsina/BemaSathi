<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Policy;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Schema;

class AdminPolicyController extends Controller
{
    public function index()
    {
        return response()->json(Policy::all());
    }

    public function show(Policy $policy)
    {
        return response()->json($policy);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'insurance_type' => 'required|string',
            'company_name' => 'required|string',
            'policy_name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('policies', 'policy_name')
                    ->where(fn ($query) => $query->where('company_name', $request->company_name)),
            ],
            'premium_amt' => 'required|numeric',
            'coverage_limit' => 'required|numeric',
            'policy_description' => 'nullable|string',
            'company_rating' => 'nullable|numeric',
            'waiting_period_days' => 'nullable|integer|min:0',
            'copay_percent' => 'nullable|integer|min:0|max:100',
            'claim_settlement_ratio' => 'nullable|numeric|min:0|max:100',
            'supports_smokers' => 'nullable|boolean',
            'covered_conditions' => 'nullable|array',
            'covered_conditions.*' => 'string',
            'exclusions' => 'nullable|array',
            'exclusions.*' => 'string',
            'agent_id' => 'nullable|numeric',
            'is_active' => 'nullable|boolean',
        ]);

        $policy = Policy::create($validated);

        return response()->json([
            'message' => 'Policy created successfully',
            'policy'  => $policy
        ], 201);
    }

    public function update(Request $request, Policy $policy)
    {
        $validated = $request->validate([
            'insurance_type' => 'sometimes|string',
            'company_name' => 'sometimes|string',
            'policy_name' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('policies', 'policy_name')
                    ->ignore($policy->id)
                    ->where(fn ($query) => $query->where('company_name', $request->get('company_name', $policy->company_name))),
            ],
            'premium_amt' => 'sometimes|numeric',
            'coverage_limit' => 'sometimes|numeric',
            'policy_description' => 'nullable|string',
            'company_rating' => 'nullable|numeric',
            'waiting_period_days' => 'nullable|integer|min:0',
            'copay_percent' => 'nullable|integer|min:0|max:100',
            'claim_settlement_ratio' => 'nullable|numeric|min:0|max:100',
            'supports_smokers' => 'nullable|boolean',
            'covered_conditions' => 'nullable|array',
            'covered_conditions.*' => 'string',
            'exclusions' => 'nullable|array',
            'exclusions.*' => 'string',
            'agent_id' => 'nullable|numeric',
            'is_active' => 'nullable|boolean',
        ]);

        $policy->update($validated);

        return response()->json([
            'message' => 'Policy updated successfully',
            'policy'  => $policy
        ]);
    }

    public function destroy(Policy $policy)
    {
        $policy->delete();

        return response()->json([
            'message' => 'Policy deleted successfully'
        ]);
    }

    public function toggle(Policy $policy)
    {
        if (Schema::hasColumn('policies', 'is_active')) {
            $policy->is_active = !($policy->is_active ?? true);
            $policy->save();
        }

        return response()->json([
            'message' => 'Policy status updated',
            'policy' => $policy,
        ]);
    }
}
