<?php

namespace App\Services;

use App\Models\Agent;

class LeadDistributor
{
    /**
     * Pick the lowest-load agent for display purposes.
     */
    public function pick(): ?Agent
    {
        $agent = Agent::query()
            ->withCount('agentInquiries')
            ->orderBy('agent_inquiries_count')
            ->orderBy('id')
            ->first();

        return $agent;
    }
}
