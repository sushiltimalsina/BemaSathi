<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class NotificationService
{
    public function notify(
        User $user,
        string $title,
        string $message,
        array $context = [],
        string $type = 'system'
    ): Notification {
        $notification = Notification::create([
            'user_id' => $user->id,
            'title' => $title,
            'message' => $message,
            'is_read' => false,
            'buy_request_id' => $context['buy_request_id'] ?? null,
            'policy_id' => $context['policy_id'] ?? null,
            'type' => $type,
        ]);

        $this->sendEmailIfPossible($user, $title, $message);

        return $notification;
    }

    private function sendEmailIfPossible(User $user, string $subject, string $message): void
    {
        if (!$user->email) {
            Log::info('Notification (no email)', [
                'user_id' => $user->id,
                'subject' => $subject,
                'message' => $message,
            ]);
            return;
        }

        try {
            Mail::raw($message, function ($mail) use ($user, $subject) {
                $mail->to($user->email)->subject($subject);
            });
        } catch (\Throwable $e) {
            Log::warning('Failed sending email notification', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
