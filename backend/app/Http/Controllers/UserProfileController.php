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
            'name' => 'nullable|string|max:255',
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
            'province' => 'nullable|string',
            'district' => 'nullable|string',
            'municipality_type' => 'nullable|string',
            'municipality_name' => 'nullable|string',
            'ward_number' => 'nullable|string',
            'street_address' => 'nullable|string',
            'family_member_details' => 'nullable|array',
            'family_member_details.*.name' => 'required|string|max:255',
            'family_member_details.*.relation' => 'required|string',
            'family_member_details.*.dob' => 'required|date',
            'family_member_details.*.is_smoker' => 'nullable|boolean',
            'family_member_details.*.pre_existing_conditions' => 'nullable|array',
        ]);

        // Auto-calculate Region Type
        $muniType = $request->get('municipality_type');
        $regionType = 'urban';
        if ($muniType === 'rural_municipality') {
            $regionType = 'rural';
        } elseif ($muniType === 'municipality') {
            $regionType = 'semi_urban';
        }
        $validated['region_type'] = $regionType;
        
        // Also sync the generic address field for backward compat
        $fullAddressItems = array_filter([
            $validated['street_address'] ?? null,
            ($validated['municipality_name'] ?? '') . ($validated['ward_number'] ? '-' . $validated['ward_number'] : ''),
            $validated['district'] ?? null,
            $validated['province'] ?? null
        ]);
        $validated['address'] = implode(', ', $fullAddressItems);

        $user->update($validated);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user->fresh()
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

        $isComplete = !empty($user->weight_kg) 
            && !empty($user->height_cm) 
            && !empty($user->occupation_class)
            && !empty($user->dob)
            && !empty($user->budget_range)
            && !empty($user->province)
            && !empty($user->district)
            && !empty($user->municipality_name);

        return response()->json([
            'is_complete' => $isComplete,
            'missing_fields' => [
                'weight' => empty($user->weight_kg),
                'height' => empty($user->height_cm),
                'occupation' => empty($user->occupation_class),
                'dob' => empty($user->dob),
                'budget' => empty($user->budget_range),
                'address' => empty($user->province) || empty($user->district) || empty($user->municipality_name),
            ]
        ]);
    }
}
