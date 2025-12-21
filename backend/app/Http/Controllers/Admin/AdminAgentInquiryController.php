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
        $items = AgentInquiry::orderByDesc('created_at')->get();
        return response()->json($items);
    }

    public function notify(Request $request, AgentInquiry $agentInquiry)
    {
        if (!$agentInquiry->agent_email) {
            return response()->json([
                'message' => 'Agent email missing.',
            ], 422);
        }

        if ($agentInquiry->notified_at) {
            return response()->json([
                'message' => 'Agent already notified.',
            ], 409);
        }

        try {
            Mail::to($agentInquiry->agent_email)->send(new AgentInquiryMail($agentInquiry));
            $agentInquiry->notified_at = now();
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
