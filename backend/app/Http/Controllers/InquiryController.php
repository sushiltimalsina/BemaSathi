<?php

namespace App\Http\Controllers;

use App\Models\Inquiry;
use Illuminate\Http\Request;

class InquiryController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'policy_id' => 'required|exists:policies,id',
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email',
            'message' => 'nullable|string'
        ]);

        // Public route: user may be unauthenticated, so guard against null user
        $data['user_id'] = $request->user()?->id;

        Inquiry::create($data);

        return response()->json([
            'message' => 'Inquiry submitted. We will contact you soon.'
        ]);
    }
}
