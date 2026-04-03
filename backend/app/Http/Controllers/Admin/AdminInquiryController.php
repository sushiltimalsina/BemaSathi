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

    public function markAsRead(Inquiry $inquiry)
    {
        $inquiry->update(['is_read' => true]);
        return response()->json(['message' => 'Marked as read', 'inquiry' => $inquiry]);
    }

    public function markAllAsRead()
    {
        Inquiry::where('is_read', false)->update(['is_read' => true]);
        return response()->json(['message' => 'All inquiries marked as read']);
    }

}
