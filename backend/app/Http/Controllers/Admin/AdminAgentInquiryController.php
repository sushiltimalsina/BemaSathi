<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\AgentInquiryMail;
use App\Models\AgentInquiry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class AdminAgentInquiryController extends Controller
{
    public function index()
    {
        $latestIds = AgentInquiry::selectRaw('MAX(id) as id')
            ->groupBy('user_id', 'policy_id', 'policy_name')
            ->pluck('id');

        $items = AgentInquiry::whereIn('id', $latestIds)
            ->with('policy')
            ->orderByDesc('created_at')
            ->get();

        $mapped = $items->map(function (AgentInquiry $item) {
            if ($item->policy?->premium_amt !== null) {
                $item->yearly_premium = (float) $item->policy->premium_amt;
            }
            return $item;
        });

        return response()->json($mapped);
    }

    public function notify(Request $request, AgentInquiry $agentInquiry)
    {
        if (!$agentInquiry->agent_email) {
            return response()->json([
                'message' => 'Agent email missing.',
            ], 422);
        }

        if ($agentInquiry->renotified_at) {
            return response()->json([
                'message' => 'Agent already renotified once.',
            ], 409);
        }

        try {
            $isRenotify = (bool) $agentInquiry->notified_at;
            Mail::to($agentInquiry->agent_email)->send(
                new AgentInquiryMail($agentInquiry, $isRenotify)
            );
            if ($isRenotify) {
                $agentInquiry->renotified_at = now();
            } else {
                $agentInquiry->notified_at = now();
            }
            $agentInquiry->save();
        } catch (\Throwable $e) {
            Log::warning('Failed sending agent inquiry email', [
                'agent_inquiry_id' => $agentInquiry->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to notify agent.',
            ], 500);
        }

        return response()->json([
            'message' => 'Agent notified.',
            'data' => $agentInquiry,
        ]);
    }
}
