<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BuyRequest;
use App\Models\KycDocument;
use App\Models\Payment;
use App\Models\Policy;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class AdminReportController extends Controller
{
    private const NEPAL_TZ = 'Asia/Kathmandu';

    public function export(Request $request)
    {
        $data = $request->validate([
            'type' => 'required|string',
            'status' => 'nullable|string',
            'from' => 'nullable|date',
            'to' => 'nullable|date',
        ]);

        $type = $data['type'];
        $status = $data['status'] ?? 'all';
        $from = $data['from'] ?? null;
        $to = $data['to'] ?? null;

        $filename = "{$type}-report.csv";
        $headers = $this->resolveHeaders($type);
        $rows = $this->resolveRows($type, $status, $from, $to);

        return response()->streamDownload(function () use ($headers, $rows) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, $headers);
            foreach ($rows as $row) {
                fputcsv($handle, $row);
            }
            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }

    private function resolveHeaders(string $type): array
    {
        return match ($type) {
            'users' => ['id', 'name', 'email', 'phone', 'created_at'],
            'policies' => ['id', 'policy_name', 'company_name', 'insurance_type', 'premium_amt', 'coverage_limit', 'is_active', 'created_at'],
            'payments' => ['id', 'user_id', 'buy_request_id', 'amount', 'method', 'status', 'is_verified', 'created_at'],
            'renewals' => ['id', 'user_id', 'policy_id', 'billing_cycle', 'cycle_amount', 'next_renewal_date', 'renewal_status', 'created_at'],
            'kyc' => ['id', 'user_id', 'document_type', 'document_number', 'status', 'verified_at', 'created_at'],
            default => ['id', 'created_at'],
        };
    }

    private function resolveRows(string $type, string $status, ?string $from, ?string $to): array
    {
        return match ($type) {
            'users' => $this->userRows($status, $from, $to),
            'policies' => $this->policyRows($status, $from, $to),
            'payments' => $this->paymentRows($status, $from, $to),
            'renewals' => $this->renewalRows($status, $from, $to),
            'kyc' => $this->kycRows($status, $from, $to),
            default => [],
        };
    }

    private function applyDateRange($query, ?string $from, ?string $to, string $column = 'created_at')
    {
        if ($from) {
            $query->whereDate($column, '>=', Carbon::parse($from)->toDateString());
        }
        if ($to) {
            $query->whereDate($column, '<=', Carbon::parse($to)->toDateString());
        }
        return $query;
    }

    private function userRows(string $status, ?string $from, ?string $to): array
    {
        $query = User::query()->select('id', 'name', 'email', 'phone', 'created_at');

        if ($status !== 'all' && Schema::hasColumn('users', 'is_active')) {
            $query->where('is_active', $status === 'active');
        }

        $this->applyDateRange($query, $from, $to);

        return $query->orderByDesc('created_at')->get()->map(fn ($u) => [
            $u->id,
            $u->name,
            $u->email,
            $u->phone,
            $this->formatNepalTime($u->created_at),
        ])->all();
    }

    private function policyRows(string $status, ?string $from, ?string $to): array
    {
        $query = Policy::query()
            ->select('id', 'policy_name', 'company_name', 'insurance_type', 'premium_amt', 'coverage_limit', 'is_active', 'created_at');

        if ($status !== 'all' && Schema::hasColumn('policies', 'is_active')) {
            $query->where('is_active', $status === 'active');
        }

        $this->applyDateRange($query, $from, $to);

        return $query->orderByDesc('created_at')->get()->map(fn ($p) => [
            $p->id,
            $p->policy_name,
            $p->company_name,
            $p->insurance_type,
            $p->premium_amt,
            $p->coverage_limit,
            $p->is_active ? 'active' : 'inactive',
            $this->formatNepalTime($p->created_at),
        ])->all();
    }

    private function paymentRows(string $status, ?string $from, ?string $to): array
    {
        $query = Payment::query()
            ->select('id', 'user_id', 'buy_request_id', 'amount', 'method', 'status', 'is_verified', 'created_at');

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        $this->applyDateRange($query, $from, $to);

        return $query->orderByDesc('created_at')->get()->map(fn ($p) => [
            $p->id,
            $p->user_id,
            $p->buy_request_id,
            $p->amount,
            $p->method,
            $p->status,
            $p->is_verified ? 'verified' : 'unverified',
            $this->formatNepalTime($p->created_at),
        ])->all();
    }

    private function renewalRows(string $status, ?string $from, ?string $to): array
    {
        $query = BuyRequest::query()->select(
            'id',
            'user_id',
            'policy_id',
            'billing_cycle',
            'cycle_amount',
            'next_renewal_date',
            'renewal_status',
            'created_at'
        );

        if ($status !== 'all') {
            $query->where('renewal_status', $status);
        }

        $this->applyDateRange($query, $from, $to);

        return $query->orderByDesc('created_at')->get()->map(fn ($r) => [
            $r->id,
            $r->user_id,
            $r->policy_id,
            $r->billing_cycle,
            $r->cycle_amount,
            $this->formatNepalTime($r->next_renewal_date),
            $r->renewal_status,
            $this->formatNepalTime($r->created_at),
        ])->all();
    }

    private function kycRows(string $status, ?string $from, ?string $to): array
    {
        $query = KycDocument::query()->select(
            'id',
            'user_id',
            'document_type',
            'document_number',
            'status',
            'verified_at',
            'created_at'
        );

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        $this->applyDateRange($query, $from, $to);

        return $query->orderByDesc('created_at')->get()->map(fn ($k) => [
            $k->id,
            $k->user_id,
            $k->document_type,
            $k->document_number,
            $k->status,
            $this->formatNepalTime($k->verified_at),
            $this->formatNepalTime($k->created_at),
        ])->all();
    }

    private function formatNepalTime($value): ?string
    {
        if (!$value) {
            return null;
        }

        return Carbon::parse($value)
            ->timezone(self::NEPAL_TZ)
            ->format('Y-m-d H:i:s');
    }
}
