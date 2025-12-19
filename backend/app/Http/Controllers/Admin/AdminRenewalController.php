<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BuyRequest;

class AdminRenewalController extends Controller
{
    public function index()
    {
        $renewals = BuyRequest::with(['user', 'policy'])
            ->select([
                'id',
                'user_id',
                'policy_id',
                'billing_cycle',
                'cycle_amount',
                'next_renewal_date',
                'renewal_status',
            ])
            ->orderByDesc('next_renewal_date')
            ->get();

        return response()->json($renewals);
    }
}
