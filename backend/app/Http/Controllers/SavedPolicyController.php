<?php

namespace App\Http\Controllers;

use App\Models\SavedPolicy;
use App\Models\Policy;
use App\Services\PremiumCalculator;
use Illuminate\Support\Carbon;
use Illuminate\Http\Request;

class SavedPolicyController extends Controller
{
    public function __construct(private PremiumCalculator $calculator)
    {
    }

    // Save a policy
    public function store(Request $request)
    {
        $request->validate([
            'policy_id' => 'required|exists:policies,id'
        ]);

        $saved = SavedPolicy::firstOrCreate([
            'user_id' => auth()->id(),
            'policy_id' => $request->policy_id
        ]);

        return response()->json($saved);
    }

    // Get saved policies for logged-in user
    public function index()
    {
        $user = auth()->user();

        $saved = SavedPolicy::where('user_id', auth()->id())
            ->with('policy')
            ->get()
            ->map(function ($item) use ($user) {
                if ($item->policy && $user) {
                    $profile = $this->resolveProfile($user);
                    $item->policy->personalized_premium = $this->calculator->quote(
                        $item->policy,
                        $profile['age'],
                        $profile['is_smoker'],
                        $profile['health_score'],
                        $profile['coverage_type'],
                        $profile['budget_range'],
                        $profile['family_members']
                    )['calculated_total'];
                }
                return $item;
            });

        return response()->json($saved);
    }

    // Remove saved policy
    public function destroy($id)
    {
        $saved = SavedPolicy::where('user_id', auth()->id())
            ->where('policy_id', $id)
            ->first();

        if (!$saved) return response()->json(['message' => 'Not saved'], 404);

        $saved->delete();

        return response()->json(['message' => 'Removed']);
    }

    private function resolveProfile($user): array
    {
        $approvedKyc = $user->kycDocuments()
            ->where('status', 'approved')
            ->latest()
            ->first();

        $dob = $user->dob ?? $approvedKyc?->dob;
        $age = $dob ? Carbon::parse($dob)->age : null;
        if (!$age || $age < 1 || $age > 120) {
            $age = 30;
        }

        return [
            'age' => $age,
            'is_smoker' => (bool) ($user->is_smoker ?? false),
            'health_score' => $user->health_score ?? null,
            'coverage_type' => $user->coverage_type ?? 'individual',
            'budget_range' => $user->budget_range ?? null,
            'family_members' => $user->family_members ?? 1,
        ];
    }
}
