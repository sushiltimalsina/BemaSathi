<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Policy;
use App\Models\Agent;
use App\Models\AgentInquiry;
use App\Models\Inquiry;
use App\Models\BuyRequest;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

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

        $monthlyPayments = Payment::query()
            ->select(DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'), DB::raw('SUM(amount) as total'))
            ->whereIn('status', ['success', 'paid', 'completed'])
            ->where('created_at', '>=', $today->copy()->subMonths(6))
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $monthlyUsers = User::query()
            ->select(DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'), DB::raw('COUNT(*) as total'))
            ->where('created_at', '>=', $today->copy()->subMonths(6))
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $paymentsByStatus = Payment::query()
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $totalBuyRequests = BuyRequest::count();
        $completedBuyRequests = BuyRequest::whereHas('payments', function ($query) {
            $query->where('is_verified', true)
                ->whereIn('status', ['success', 'paid', 'completed']);
        })->count();

        $topAgents = Agent::query()
            ->withCount('agentInquiries')
            ->orderByDesc('agent_inquiries_count')
            ->take(5)
            ->get(['id', 'name', 'email']);

        $activePolicies = Schema::hasColumn('policies', 'is_active')
            ? Policy::where('is_active', true)->count()
            : Policy::count();

        $renewalsDue = BuyRequest::query()
            ->whereHas('payments', function ($query) {
                $query->where('is_verified', true)
                    ->whereIn('status', ['success', 'paid', 'completed']);
            })
            ->whereNotNull('next_renewal_date')
            ->whereBetween('next_renewal_date', [$today->copy()->toDateString(), $today->copy()->addDays(7)->toDateString()])
            ->count();

        $totalPayments = Payment::query()
            ->whereIn('status', ['success', 'paid', 'completed'])
            ->sum('amount');

        $recentPayments = Payment::with(['user', 'buyRequest.policy'])
            ->orderByDesc('created_at')
            ->take(5)
            ->get(['id', 'user_id', 'buy_request_id', 'amount', 'method', 'status', 'created_at']);

        $upcomingRenewals = BuyRequest::with(['user', 'policy'])
            ->whereHas('payments', function ($query) {
                $query->where('is_verified', true)
                    ->whereIn('status', ['success', 'paid', 'completed']);
            })
            ->whereNotNull('next_renewal_date')
            ->orderBy('next_renewal_date')
            ->take(5)
            ->get(['id', 'user_id', 'policy_id', 'next_renewal_date', 'renewal_status', 'billing_cycle', 'cycle_amount']);

        return response()->json([
            'totals' => [
                'users' => User::count(),
                'activePolicies' => $activePolicies,
                'renewalsDue' => $renewalsDue,
                'totalPayments' => $totalPayments,
                'agents' => Agent::count(),
                'inquiries' => Inquiry::count(),
                'buyRequests' => $totalBuyRequests,
            ],
            'conversionRate' => $totalBuyRequests ? round(($completedBuyRequests / $totalBuyRequests) * 100, 2) : 0,
            'dailyBuyRequests' => $dailyBuyRequests,
            'paymentsByStatus' => $paymentsByStatus,
            'topAgents' => $topAgents,
            'recentPayments' => $recentPayments,
            'upcomingRenewals' => $upcomingRenewals,
            'monthlyPayments' => $monthlyPayments,
            'monthlyUsers' => $monthlyUsers,
        ]);
    }
}
