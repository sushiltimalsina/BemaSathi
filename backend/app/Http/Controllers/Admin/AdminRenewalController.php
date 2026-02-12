<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BuyRequest;
use App\Services\NotificationService;
use App\Mail\PolicyRenewalReminderMail;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class AdminRenewalController extends Controller
{
    private NotificationService $notifier;

    public function __construct(NotificationService $notifier)
    {
        $this->notifier = $notifier;
    }

    public function index()
    {
        $renewals = BuyRequest::with(['user', 'policy'])
            ->whereHas('payments', function ($query) {
                $query->where('is_verified', true)
                    ->whereIn('status', ['success', 'paid', 'completed']);
            })
            ->select([
                'id',
                'user_id',
                'policy_id',
                'billing_cycle',
                'cycle_amount',
                'next_renewal_date',
                'renewal_status',
                'renewal_reminder_sent_at',
                'renewal_grace_reminders_sent',
                'renewal_grace_last_sent_at',
            ])
            ->orderByDesc('next_renewal_date')
            ->get();

        return response()->json($renewals);
    }

    public function notify(Request $request, BuyRequest $buyRequest)
    {
        $buyRequest->load(['user', 'policy']);

        if (!$buyRequest->user || !$buyRequest->next_renewal_date) {
            return response()->json([
                'message' => 'Unable to send renewal notification.',
            ], 422);
        }

        $policyName = optional($buyRequest->policy)->policy_name ?? 'your policy';
        $timezone = config('app.timezone', 'Asia/Kathmandu');
        $dateText = Carbon::parse($buyRequest->next_renewal_date)->timezone($timezone)->toFormattedDateString();

        if ($buyRequest->renewal_status === 'active') {
            $daysLeft = Carbon::now($timezone)->diffInDays(
                Carbon::parse($buyRequest->next_renewal_date, $timezone),
                false
            );
            if ($daysLeft > 5) {
                return response()->json([
                    'message' => 'Renewal date is not within 5 days.',
                ], 422);
            }
            if ($buyRequest->renewal_reminder_sent_at) {
                return response()->json([
                    'message' => 'Renewal reminder already sent.',
                ], 409);
            }

            $this->notifier->notify(
                $buyRequest->user,
                'Renewal reminder',
                "Your policy {$policyName} renews on {$dateText}. Please renew to keep your coverage active.",
                [
                    'buy_request_id' => $buyRequest->id,
                    'policy_id' => $buyRequest->policy_id,
                ],
                'system',
                false
            );
            $this->sendRenewalEmail($buyRequest);
            $buyRequest->renewal_reminder_sent_at = Carbon::now($timezone);
            $buyRequest->save();
        } elseif ($buyRequest->renewal_status === 'due') {
            $dueDate = Carbon::parse($buyRequest->next_renewal_date, $timezone)->startOfDay();
            $today = Carbon::now($timezone)->startOfDay();
            $daysPastDue = $dueDate->diffInDays($today, false);
            $graceDays = (int) env('RENEWAL_GRACE_DAYS', 7);
            if ($daysPastDue > $graceDays) {
                return response()->json([
                    'message' => 'Grace period has ended for this renewal.',
                ], 422);
            }
            $sentCount = (int) ($buyRequest->renewal_grace_reminders_sent ?? 0);
            if ($sentCount >= 2) {
                return response()->json([
                    'message' => 'Maximum grace reminders already sent.',
                ], 409);
            }

            $this->notifier->notify(
                $buyRequest->user,
                'Renewal reminder',
                "Your policy {$policyName} renews on {$dateText}. Please renew to keep your coverage active.",
                [
                    'buy_request_id' => $buyRequest->id,
                    'policy_id' => $buyRequest->policy_id,
                ],
                'system',
                false
            );
            $this->sendRenewalEmail($buyRequest);
            $buyRequest->renewal_grace_reminders_sent = $sentCount + 1;
            $buyRequest->renewal_grace_last_sent_at = Carbon::now($timezone);
            $buyRequest->save();
        } else {
            return response()->json([
                'message' => 'Renewal reminder is not allowed for this status.',
            ], 422);
        }

        return response()->json([
            'message' => 'Renewal notification sent.',
            'renewal' => $buyRequest->only([
                'id',
                'renewal_reminder_sent_at',
                'renewal_grace_reminders_sent',
                'renewal_grace_last_sent_at',
            ]),
        ]);
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
