<?php

namespace App\Http\Controllers;

use App\Models\AgentInquiry;
use App\Models\BuyRequest;
use App\Models\Policy;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AgentInquiryController extends Controller
{
    public function store(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'policy_id' => 'required|exists:policies,id',
        ]);

        $policy = Policy::with('agent')->findOrFail($data['policy_id']);
        $agent = $policy->agent;
        $latestRequest = BuyRequest::where('user_id', $user?->id)
            ->where('policy_id', $policy->id)
            ->latest()
            ->first();
        $premiumAmount = $latestRequest?->cycle_amount ?? $policy->premium_amt;

        $inquiry = AgentInquiry::create([
            'user_id' => $user?->id,
            'policy_id' => $policy->id,
            'agent_id' => $agent?->id,
            'user_name' => $user?->name,
            'user_email' => $user?->email,
            'policy_name' => $policy->policy_name,
            'company_name' => $policy->company_name,
            'premium_amount' => $premiumAmount,
            'coverage_limit' => $policy->coverage_limit,
            'agent_name' => $agent?->name,
            'agent_email' => $agent?->email,
            'agent_phone' => $agent?->phone,
        ]);

        if (!$agent) {
            Log::info('Agent inquiry created without agent', [
                'policy_id' => $policy->id,
                'user_id' => $user?->id,
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => $inquiry,
        ]);
    }
}
