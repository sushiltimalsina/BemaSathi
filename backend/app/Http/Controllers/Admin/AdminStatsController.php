<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Policy;
use App\Models\Agent;
use App\Models\Inquiry;
use App\Models\BuyRequest;
use App\Models\Payment;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AdminStatsController extends Controller
{
    public function stats()
    {
        $today = Carbon::today();

        $dailyBuyRequests = BuyRequest::query()
            ->select(DB::raw('DATE(created_at) as day'), DB::raw('count(*) as total'))
            ->where('created_at', '>=', $today->copy()->subDays(30))
            ->groupBy('day')
            ->orderBy('day')
            ->get();

        $paymentsByStatus = Payment::query()
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $topAgents = Agent::query()
            ->withCount([
                'buyRequests as completed_leads_count' => function ($query) {
                    $query->where('status', 'completed');
                },
                'buyRequests as active_leads_count' => function ($query) {
                    $query->whereIn('status', ['pending', 'processing', 'assigned']);
                },
            ])
            ->orderByDesc('completed_leads_count')
            ->take(5)
            ->get(['id', 'name', 'email']);

        $totalBuyRequests = BuyRequest::count();
        $completedBuyRequests = BuyRequest::where('status', 'completed')->count();

        return response()->json([
            'totals' => [
                'policies'   => Policy::count(),
                'agents'     => Agent::count(),
                'inquiries'  => Inquiry::count(),
                'buyRequests' => $totalBuyRequests,
            ],
            'conversionRate' => $totalBuyRequests ? round(($completedBuyRequests / $totalBuyRequests) * 100, 2) : 0,
            'dailyBuyRequests' => $dailyBuyRequests,
            'paymentsByStatus' => $paymentsByStatus,
            'topAgents' => $topAgents,
        ]);
    }
}
