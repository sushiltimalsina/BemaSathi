<?php

namespace App\Services;

use App\Models\Agent;
use App\Models\BuyRequest;

class LeadDistributor
{
    /**
     * Assign the lowest-load agent for the given request.
     */
    public function assign(BuyRequest $buyRequest): ?Agent
    {
        $agent = Agent::query()
            ->withCount([
                'buyRequests as active_leads_count' => function ($query) {
                    $query->whereIn('status', ['pending', 'processing', 'assigned']);
                },
            ])
            ->orderBy('active_leads_count')
            ->orderBy('id')
            ->first();

        if (!$agent) {
            return null;
        }

        $buyRequest->agent_id = $agent->id;
        $buyRequest->status = $buyRequest->status === 'pending' ? 'assigned' : $buyRequest->status;
        $buyRequest->save();

        return $agent;
    }
}
