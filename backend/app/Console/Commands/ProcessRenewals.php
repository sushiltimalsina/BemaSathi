<?php

// app/Console/Commands/ProcessRenewals.php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\BuyRequest;
use App\Services\NotificationService;
use App\Mail\PolicyRenewalReminderMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Carbon;

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
        $timezone = config('app.timezone', 'Asia/Kathmandu');
        $today = Carbon::now($timezone)->startOfDay();
        $graceDays = (int) env('RENEWAL_GRACE_DAYS', 7);

        // 0) Send renewal reminders within 5 days of due date (only once)
        $reminderWindowEnd = $today->copy()->addDays(5)->toDateString();
        $dueSoon = BuyRequest::where('renewal_status', 'active')
            ->whereNotNull('next_renewal_date')
            ->whereDate('next_renewal_date', '>=', $today->toDateString())
            ->whereDate('next_renewal_date', '<=', $reminderWindowEnd)
            ->whereNull('renewal_reminder_sent_at')
            ->get();

        foreach ($dueSoon as $br) {
            $br->renewal_reminder_sent_at = Carbon::now($timezone);
            $br->save();

            $user = $br->user;
            if ($user) {
                $dateText = Carbon::parse($br->next_renewal_date, $timezone)->toFormattedDateString();
                $this->notifier->notify(
                    $user,
                    'Policy Renewal Reminder',
                    "Your policy {$br->policy->policy_name} renews on {$dateText}. Please renew within {$graceDays} days to keep your coverage active.",
                    ['buy_request_id' => $br->id]
                );
            }

            $this->sendRenewalEmail($br);
        }

        // 1) Mark ACTIVE → DUE when renewal date is today or passed
        $dueList = BuyRequest::where('renewal_status', 'active')
            ->whereDate('next_renewal_date', '<=', $today)
            ->get();

        foreach ($dueList as $br) {
            $br->renewal_status = 'due';
            $br->renewal_grace_reminders_sent = 0;
            $br->renewal_grace_last_sent_at = null;
            $br->save();

            $user = $br->user; // assumes relation buyRequest->user exists
            if ($user) {
                $daysLeft = max($graceDays, 0);
                $this->notifier->notify(
                    $user,
                    'Policy Renewal Due',
                    "Your policy {$br->policy->policy_name} is due for renewal. Please renew within {$daysLeft} days to avoid expiry.",
                    ['buy_request_id' => $br->id]
                );
            }
            $this->sendRenewalEmail($br);
        }

        // 1b) Send up to 2 grace reminders while status is DUE
        $graceList = BuyRequest::where('renewal_status', 'due')
            ->whereNotNull('next_renewal_date')
            ->get();

        foreach ($graceList as $br) {
            $sentCount = (int) ($br->renewal_grace_reminders_sent ?? 0);
            if ($sentCount >= 2) {
                continue;
            }

            $dueDate = Carbon::parse($br->next_renewal_date, $timezone)->startOfDay();
            $daysPastDue = $dueDate->diffInDays($today, false);
            if ($daysPastDue < 0 || $daysPastDue > $graceDays) {
                continue;
            }

            if ($br->renewal_grace_last_sent_at) {
                $lastSent = Carbon::parse($br->renewal_grace_last_sent_at, $timezone)->startOfDay();
                if ($lastSent->diffInDays($today) < 2) {
                    continue;
                }
            }

            $daysLeft = max($graceDays - $daysPastDue, 0);
            $user = $br->user;
            if ($user) {
                $this->notifier->notify(
                    $user,
                    'Renewal Reminder',
                    "Your policy {$br->policy->policy_name} is overdue. Please renew within {$daysLeft} days to keep your coverage active, or it will be ineffective after the expiry date.",
                    ['buy_request_id' => $br->id]
                );
            }

            $this->sendRenewalEmail($br);

            $br->renewal_grace_reminders_sent = $sentCount + 1;
            $br->renewal_grace_last_sent_at = Carbon::now($timezone);
            $br->save();
        }

        // 2) Mark DUE → EXPIRED after 7-day grace period
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
                    ['buy_request_id' => $br->id]
                );
            }
        }

        $this->info("Renewals processed: due={$dueList->count()}, expired={$expiredList->count()}");

        return Command::SUCCESS;
    }

    private function sendRenewalEmail(BuyRequest $buyRequest): void
    {
        $buyRequest->loadMissing('user', 'policy');
        $emails = array_filter([
            $buyRequest->user?->email,
            $buyRequest->email,
        ]);
        $unique = array_values(array_unique($emails));

        foreach ($unique as $email) {
            try {
                Mail::to($email)->send(new PolicyRenewalReminderMail($buyRequest));
            } catch (\Throwable $e) {
                // ignore email failures
            }
        }
    }
}
