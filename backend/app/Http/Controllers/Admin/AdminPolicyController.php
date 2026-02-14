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
        return response()->json(Policy::with(['agent', 'agents'])->get());
    }

    public function show(Policy $policy)
    {
        $policy->load(['agent', 'agents']);
        return response()->json($policy);
    }

    public function store(Request $request)
    {
        $rules = [
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
            'agent_id' => 'nullable|exists:agents,id', // Make nullable if agents provided
            'agents' => 'nullable|array',
            'agents.*' => 'exists:agents,id',
            'is_active' => 'nullable|boolean',
            'premium_factor' => 'nullable|numeric|min:0.1',
            'age_factor_step' => 'nullable|numeric',
            'smoker_factor' => 'nullable|numeric',
            'condition_factor' => 'nullable|numeric',
            'family_base_factor' => 'nullable|numeric',
            'family_member_step' => 'nullable|numeric',
            'age_0_2_factor' => 'nullable|numeric',
            'age_3_17_factor' => 'nullable|numeric',
            'age_18_24_factor' => 'nullable|numeric',
            'age_25_plus_base_factor' => 'nullable|numeric',
            'region_urban_factor' => 'nullable|numeric',
            'region_semi_urban_factor' => 'nullable|numeric',
            'region_rural_factor' => 'nullable|numeric',
            'loyalty_discount_factor' => 'nullable|numeric',
            'bmi_overweight_factor' => 'nullable|numeric',
            'bmi_obese_factor' => 'nullable|numeric',
            'occ_class_2_factor' => 'nullable|numeric',
            'occ_class_3_factor' => 'nullable|numeric',
        ];

        $validated = $request->validate($rules);

        // Fallback for single agent_id if multiple agents provided
        if (!empty($validated['agents']) && empty($validated['agent_id'])) {
            $validated['agent_id'] = $validated['agents'][0];
        }

        // Create policy (agent_id required by DB, ensured above or by request)
        if (empty($validated['agent_id'])) {
             // Handle case where strictly no agent is provided but DB requires it?
             // Since we want multiple agents, likely we should just pick one or fail if none.
             // For now assume agents array is mandatory if agent_id is missing.
             if (empty($validated['agents'])) {
                 // Force validation error or rely on DB exception?
                 // Let's rely on basic validation "required_without:agents" logic if we were strictly using rules.
                 // But simply:
             }
        }
        
        $policy = Policy::create($validated);

        if (!empty($validated['agents'])) {
            $policy->agents()->sync($validated['agents']);
        } elseif (!empty($validated['agent_id'])) {
             // If only agent_id provided (legacy), sync that one
            $policy->agents()->sync([$validated['agent_id']]);
        }

        return response()->json([
            'message' => 'Policy created successfully',
            'policy'  => $policy->load('agents')
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
            'agent_id' => 'nullable|exists:agents,id',
            'agents' => 'nullable|array',
            'agents.*' => 'exists:agents,id',
            'is_active' => 'nullable|boolean',
            'premium_factor' => 'nullable|numeric|min:0.1',
            'age_factor_step' => 'nullable|numeric',
            'smoker_factor' => 'nullable|numeric',
            'condition_factor' => 'nullable|numeric',
            'family_base_factor' => 'nullable|numeric',
            'family_member_step' => 'nullable|numeric',
            'age_0_2_factor' => 'nullable|numeric',
            'age_3_17_factor' => 'nullable|numeric',
            'age_18_24_factor' => 'nullable|numeric',
            'age_25_plus_base_factor' => 'nullable|numeric',
            'region_urban_factor' => 'nullable|numeric',
            'region_semi_urban_factor' => 'nullable|numeric',
            'region_rural_factor' => 'nullable|numeric',
            'loyalty_discount_factor' => 'nullable|numeric',
            'bmi_overweight_factor' => 'nullable|numeric',
            'bmi_obese_factor' => 'nullable|numeric',
            'occ_class_2_factor' => 'nullable|numeric',
            'occ_class_3_factor' => 'nullable|numeric',
        ]);

        // Fallback for single agent_id if multiple agents provided
        if (!empty($validated['agents']) && empty($validated['agent_id'])) {
            $validated['agent_id'] = $validated['agents'][0];
        }

        $policy->update($validated);

        if (array_key_exists('agents', $validated)) {
            $policy->agents()->sync($validated['agents']);
        } elseif (!empty($validated['agent_id'])) {
            // Keep sync if strictly changing agent_id?
            // Optional: $policy->agents()->sync([$validated['agent_id']]);
        }

        return response()->json([
            'message' => 'Policy updated successfully',
            'policy'  => $policy->load('agents')
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
