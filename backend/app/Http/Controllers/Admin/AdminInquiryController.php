<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Inquiry;

class AdminInquiryController extends Controller
{
    public function index()
    {
        $inquiries = Inquiry::with('policy')->get();
        return response()->json($inquiries);
    }

    public function show(Inquiry $inquiry)
    {
        $inquiry->load('policy');
        return response()->json($inquiry);
    }

    public function destroy(Inquiry $inquiry)
    {
        $inquiry->delete();

        return response()->json([
            'message' => 'Inquiry deleted successfully'
        ]);
    }
}
