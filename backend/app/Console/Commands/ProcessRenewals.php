<?php

// app/Console/Commands/ProcessRenewals.php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\BuyRequest;
use App\Services\NotificationService;
use Illuminate\Support\Carbon;
use App\Mail\PolicyRenewalReminderMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class ProcessRenewals extends Command
{
    protected $signature = 'renewals:process';
    protected $description = 'Mark due / expired renewals and notify users';

    public function __construct(private NotificationService $notifier)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $today = Carbon::today();
        $graceDays = 7;

        // 1) Mark ACTIVE -> DUE when renewal date is today
        $dueList = BuyRequest::where('renewal_status', 'active')
            ->whereDate('next_renewal_date', '<=', $today)
            ->get();

        foreach ($dueList as $br) {
            $br->renewal_status = 'due';
            $br->save();

            $user = $br->user; // assumes relation buyRequest->user exists
            if ($user) {
                if ($user->email) {
                    try {
                        $br->loadMissing('policy');
                        Mail::to($user->email)->send(new PolicyRenewalReminderMail($br));
                    } catch (\Throwable $e) {
                        Log::warning('Failed sending renewal reminder email', [
                            'buy_request_id' => $br->id,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }

                $this->notifier->notify(
                    $user,
                    'Policy Renewal Due',
                    "Your policy ({$br->policy->policy_name}) is due for renewal. Please renew within {$graceDays} days to avoid expiry.",
                    ['buy_request_id' => $br->id],
                    'system',
                    false
                );
            }
        }

        // 2) Mark DUE -> EXPIRED after 7-day grace period
        $expiredList = BuyRequest::where('renewal_status', 'due')
            ->whereDate('next_renewal_date', '<', $today->copy()->subDays($graceDays))
            ->get();

        foreach ($expiredList as $br) {
            $br->renewal_status = 'expired';
            $br->save();

            $user = $br->user;
            if ($user) {
                $this->notifier->notify(
                    $user,
                    'Policy Expired',
                    "Your policy ({$br->policy->policy_name}) has expired because it was not renewed within {$graceDays} days.",
                    ['buy_request_id' => $br->id],
                    'system',
                    false
                );
            }
        }

        $this->info("Renewals processed: due={$dueList->count()}, expired={$expiredList->count()}");

        return Command::SUCCESS;
    }
}
