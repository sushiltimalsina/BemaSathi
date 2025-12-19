<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class AdminReportController extends Controller
{
    public function export(Request $request)
    {
        $data = $request->validate([
            'type' => 'required|string',
            'status' => 'nullable|string',
            'from' => 'nullable|date',
            'to' => 'nullable|date',
        ]);

        $csv = "type,status,from,to\n";
        $csv .= "{$data['type']}," . ($data['status'] ?? 'all') . "," . ($data['from'] ?? '') . "," . ($data['to'] ?? '') . "\n";

        return response()->streamDownload(function () use ($csv) {
            echo $csv;
        }, "{$data['type']}-report.csv", [
            'Content-Type' => 'text/csv',
        ]);
    }
}
