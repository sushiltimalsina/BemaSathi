<?php

namespace App\Http\Controllers;

use App\Models\Inquiry;
use Illuminate\Http\Request;

class InquiryController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:20',
            'message' => 'required|string',
            'policy_id' => 'nullable|exists:policies,id',
        ]);

        // Public route: user may be unauthenticated, so guard against null user
        $data['user_id'] = $request->user()?->id;

        Inquiry::create($data);

        return response()->json([
            'message' => 'Inquiry submitted. We will contact you soon.'
        ]);
    }
}
