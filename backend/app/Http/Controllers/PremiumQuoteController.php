<?php

namespace App\Http\Controllers;

use App\Models\Policy;
use App\Services\PremiumCalculator;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class PremiumQuoteController extends Controller
{
    public function __construct(private PremiumCalculator $calculator)
    {
    }

    /**
     * Return a premium quote for a policy based on provided inputs
     * (or fall back to the authenticated user's profile if available).
     */
    public function quote(Request $request)
    {
        $data = $request->validate([
            'policy_id' => 'required|exists:policies,id',
            'age' => 'nullable|integer|min:1|max:120',
            'dob' => 'nullable|date|before:today',
            'is_smoker' => 'nullable|boolean',
            'health_score' => 'nullable|integer|min:1|max:100',
            'coverage_type' => 'nullable|in:individual,family',
            'budget_range' => 'nullable|string',
            'family_members' => 'nullable|integer|min:1|max:20',
            'region_type' => 'nullable|string',
            'city' => 'nullable|string',
            'weight' => 'nullable|numeric',
            'height' => 'nullable|numeric',
            'occupation_class' => 'nullable|string',
            'conditions' => 'nullable|array'
        ]);

        $policy = Policy::findOrFail($data['policy_id']);
        $profile = $this->resolveProfile($request->user(), $data);

        $quote = $this->calculator->quote(
            $policy,
            $profile['age'],
            $profile['is_smoker'],
            $profile['health_score'],
            $profile['coverage_type'],
            $profile['budget_range'],
            $profile['family_members'],
            [
                'region_type' => $profile['region_type'], 
                'city' => $profile['city'],
                'weight' => $profile['weight'],
                'height' => $profile['height'],
                'occupation_class' => $profile['occupation_class'],
                'conditions' => $profile['conditions']
            ]
        );

        return response()->json([
            'success' => true,
            'quote' => $quote,
        ]);
    }

    private function resolveProfile($user, array $data): array
    {
        $age = $data['age'] ?? null;
        if (!$age && !empty($data['dob'])) {
            $age = Carbon::parse($data['dob'])->age;
        }

        if (!$age && $user) {
            $kyc = $user->kycDocuments()->where('status', 'approved')->latest()->first();
            $dob = $user->dob ?? $kyc?->dob;
            if ($dob) {
                $age = Carbon::parse($dob)->age;
            }
        }

        return [
            'age' => $age,
            'is_smoker' => $data['is_smoker'] ?? (bool) ($user?->is_smoker),
            'health_score' => $data['health_score'] ?? ($user?->health_score),
            'coverage_type' => $data['coverage_type'] ?? ($user?->coverage_type),
            'budget_range' => $data['budget_range'] ?? ($user?->budget_range),
            'family_members' => $data['family_members'] ?? ($user?->family_members),
            'region_type' => $data['region_type'] ?? ($user?->region_type ?? 'urban'),
            'city' => $data['city'] ?? ($user?->municipality_name ?? $user?->address),
            'weight' => $data['weight'] ?? ($user?->weight_kg),
            'height' => $data['height'] ?? ($user?->height_cm),
            'occupation_class' => $data['occupation_class'] ?? ($user?->occupation_class ?? 'class_1'),
            'conditions' => $data['conditions'] ?? (is_array($user?->pre_existing_conditions)
                ? $user->pre_existing_conditions
                : json_decode($user?->pre_existing_conditions ?? '[]', true))
        ];
    }
}
