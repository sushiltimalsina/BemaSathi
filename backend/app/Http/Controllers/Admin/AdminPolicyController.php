<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Policy;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

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
            'agent_id' => 'nullable|numeric',
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
            'agent_id' => 'nullable|numeric',
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
}
