<?php

namespace App\Mail;

use App\Models\AgentInquiry;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AgentInquiryMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public AgentInquiry $agentInquiry)
    {
    }

    public function build()
    {
        return $this->subject('New Client Policy Inquiry')
            ->view('emails.agent-inquiry')
            ->with([
                'agentName' => $this->agentInquiry->agent_name,
                'clientName' => $this->agentInquiry->user_name,
                'clientEmail' => $this->agentInquiry->user_email,
                'clientPhone' => $this->agentInquiry->user?->phone,
                'policyName' => $this->agentInquiry->policy_name,
                'companyName' => $this->agentInquiry->company_name,
                'premiumAmount' => $this->agentInquiry->premium_amount,
                'coverageLimit' => $this->agentInquiry->coverage_limit,
            ]);
    }
}
