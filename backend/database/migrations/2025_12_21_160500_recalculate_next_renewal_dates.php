<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $requests = DB::table('buy_requests')
            ->select(['id', 'billing_cycle'])
            ->get();

        foreach ($requests as $request) {
            $payments = DB::table('payments')
                ->where('buy_request_id', $request->id)
                ->where('is_verified', 1)
                ->orderByRaw('COALESCE(verified_at, paid_at, created_at) asc')
                ->get(['verified_at', 'paid_at', 'created_at']);

            if ($payments->isEmpty()) {
                continue;
            }

            $anchor = $payments->first();
            $anchorDate = Carbon::parse($anchor->verified_at ?? $anchor->paid_at ?? $anchor->created_at);
            $count = $payments->count();

            $cycle = $request->billing_cycle ?: 'yearly';
            $nextRenewal = match ($cycle) {
                'monthly' => $anchorDate->copy()->addMonths($count),
                'quarterly' => $anchorDate->copy()->addMonths($count * 3),
                'half_yearly' => $anchorDate->copy()->addMonths($count * 6),
                default => $anchorDate->copy()->addYears($count),
            };

            DB::table('buy_requests')
                ->where('id', $request->id)
                ->update(['next_renewal_date' => $nextRenewal->toDateString()]);
        }
    }

    public function down(): void
    {
        // No safe down migration for recalculated dates.
    }
};
