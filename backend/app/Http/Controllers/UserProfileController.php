<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserProfileController extends Controller
{
    /**
     * Update user profile with BMI and occupation data
     */
    public function update(Request $request)
    {
        $user = Auth::guard('sanctum')->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'phone' => 'nullable|string|max:30',
            'address' => 'nullable|string|max:255',
            'dob' => 'nullable|date|before:today',
            'is_smoker' => 'nullable|boolean',
            'budget_range' => 'nullable|string',
            'coverage_type' => 'nullable|in:individual,family',
            'family_members' => 'nullable|integer|min:1|max:20',
            'pre_existing_conditions' => 'nullable|array',
            'pre_existing_conditions.*' => 'in:diabetes,heart,hypertension,asthma',
            'weight_kg' => 'nullable|numeric|min:20|max:300',
            'height_cm' => 'nullable|integer|min:50|max:250',
            'occupation_class' => 'nullable|in:class_1,class_2,class_3',
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user
        ]);
    }

    /**
     * Check if profile is complete
     */
    public function checkCompletion(Request $request)
    {
        $user = Auth::guard('sanctum')->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $isComplete = !empty($user->weight_kg) && !empty($user->height_cm) && !empty($user->occupation_class);

        return response()->json([
            'is_complete' => $isComplete,
            'missing_fields' => [
                'weight' => empty($user->weight_kg),
                'height' => empty($user->height_cm),
                'occupation' => empty($user->occupation_class),
            ]
        ]);
    }
}
