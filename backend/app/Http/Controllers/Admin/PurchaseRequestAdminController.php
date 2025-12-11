<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PurchaseRequest;
use Illuminate\Http\Request;

class PurchaseRequestAdminController extends Controller
{
    /**
     * List purchase requests with filters
     */
    public function index(Request $request)
    {
        $query = PurchaseRequest::with(['user', 'policy'])
            ->orderBy('created_at', 'desc');

        if ($request->status && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->search) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('phone', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%");
            });
        }

        return response()->json($query->paginate(15));
    }

    /**
     * Update status (contacted / completed / cancelled)
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:pending,contacted,completed,cancelled',
        ]);

        $pr = PurchaseRequest::findOrFail($id);
        $pr->update(['status' => $request->status]);

        return response()->json([
            'success' => true,
            'message' => "Status updated.",
            'data'    => $pr
        ]);
    }

    /**
     * Soft delete request
     */
    public function destroy($id)
    {
        $pr = PurchaseRequest::findOrFail($id);
        $pr->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}

