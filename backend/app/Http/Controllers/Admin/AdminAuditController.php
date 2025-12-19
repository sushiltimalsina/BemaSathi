<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;

class AdminAuditController extends Controller
{
    public function index()
    {
        // Placeholder until audit logging is implemented
        return response()->json([]);
    }

    public function export()
    {
        $csv = "event,description,admin,created_at\n";
        return response()->streamDownload(function () use ($csv) {
            echo $csv;
        }, "audit_logs.csv", [
            'Content-Type' => 'text/csv',
        ]);
    }
}
