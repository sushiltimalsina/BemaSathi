<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Policy;
use App\Services\PremiumCalculator;

class PremiumQuoteController extends Controller
{
    public function __construct(private PremiumCalculator $calculator) {}

    public function quote(Request $request)
    {
        $data = $request->validate([
            'policy_id'    => 'required|exists:policies,id',
            'age'          => 'required|integer|min:1|max:120',
            'is_smoker'    => 'required|boolean',
            'health_score' => 'nullable|integer|min:0|max:100',
            'coverage_type' => 'nullable|string',
            'budget_range' => 'nullable|string'
        ]);

        $policy = Policy::findOrFail($data['policy_id']);

        $result = $this->calculator->quote(
            $policy,
            $data['age'],
            $data['is_smoker'],
            $data['health_score'] ?? null,
            $data['coverage_type'] ?? null,
            $data['budget_range'] ?? null
        );

        return response()->json([
            'message' => 'Premium calculated successfully',
            'data'    => $result
        ]);
    }
}
