<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;

class AdminAuditController extends Controller
{
    public function index()
    {
        $logs = AuditLog::query()
            ->orderByDesc('created_at')
            ->limit(500)
            ->get();

        return response()->json($logs);
    }

    public function export()
    {
        $logs = AuditLog::query()
            ->orderByDesc('created_at')
            ->get(['event', 'description', 'admin_name', 'created_at']);

        return response()->streamDownload(function () use ($logs) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['event', 'description', 'admin', 'created_at']);
            foreach ($logs as $log) {
                fputcsv($handle, [
                    $log->event,
                    $log->description,
                    $log->admin_name,
                    $log->created_at,
                ]);
            }
            fclose($handle);
        }, "audit_logs.csv", [
            'Content-Type' => 'text/csv',
        ]);
    }
}
