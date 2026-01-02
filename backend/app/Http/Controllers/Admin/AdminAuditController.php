<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Carbon\Carbon;

class AdminAuditController extends Controller
{
    public function index()
    {
        try {
            $logs = AuditLog::query()
                ->orderByDesc('created_at')
                ->limit(500)
                ->get();
        } catch (\Throwable $e) {
            return response()->json([
                'data' => [],
                'message' => 'Audit logs unavailable. Run migrations to enable audit logging.',
            ]);
        }

        return response()->json($logs);
    }

    public function export()
    {
        try {
            $logs = AuditLog::query()
                ->orderByDesc('created_at')
                ->get(['event', 'description', 'admin_name', 'created_at']);
        } catch (\Throwable $e) {
            $logs = collect();
        }

        $tz = 'Asia/Kathmandu';
        return response()->streamDownload(function () use ($logs, $tz) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['event', 'description', 'admin', 'created_at']);
            foreach ($logs as $log) {
                fputcsv($handle, [
                    $log->event,
                    $log->description,
                    $log->admin_name,
                    $log->created_at
                        ? Carbon::parse($log->created_at)->timezone($tz)->format('Y-m-d H:i:s')
                        : null,
                ]);
            }
            fclose($handle);
        }, "audit_logs.csv", [
            'Content-Type' => 'text/csv',
        ]);
    }
}
