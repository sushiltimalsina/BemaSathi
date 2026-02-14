<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Policy;
use App\Mail\CompanyWelcomeMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Mail;

class AdminCompanyController extends Controller
{
    public function index()
    {
        return response()->json(Company::with('agent')->get());
    }

    public function show(Company $company)
    {
        $company->load('agent');
        return response()->json($company);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string',
            'email'       => 'required|email',
            'phone'       => 'required|string',
            'address'     => 'nullable|string',
            'description' => 'nullable|string',
            'agent_id'    => 'nullable|exists:agents,id',
            'is_active'   => 'nullable|boolean',
        ]);

        $company = Company::create($validated);

        // Send welcome email to company
        try {
            Mail::to($company->email)->send(new CompanyWelcomeMail($company));
        } catch (\Throwable $e) {
            // Log error but don't fail the request
            \Log::error('Failed to send company welcome email: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Company created successfully',
            'company' => $company
        ], 201);
    }

    public function update(Request $request, Company $company)
    {
        $previousName = $company->name;
        $validated = $request->validate([
            'name'        => 'required|string',
            'email'       => 'required|email',
            'phone'       => 'required|string',
            'address'     => 'nullable|string',
            'description' => 'nullable|string',
            'agent_id'    => 'nullable|exists:agents,id',
            'is_active'   => 'nullable|boolean',
        ]);

        $company->update($validated);

        if (Schema::hasColumn('policies', 'is_active') && array_key_exists('is_active', $validated)) {
            Policy::whereIn('company_name', [$previousName, $company->name])
                ->update(['is_active' => (bool) $company->is_active]);
        }

        return response()->json([
            'message' => 'Company updated successfully',
            'company' => $company
        ]);
    }

    public function destroy(Company $company)
    {
        $company->delete();

        return response()->json([
            'message' => 'Company deleted successfully'
        ]);
    }

    public function toggle(Company $company)
    {
        if (Schema::hasColumn('companies', 'is_active')) {
            $company->is_active = !($company->is_active ?? true);
            $company->save();
        }

        if (Schema::hasColumn('policies', 'is_active')) {
            Policy::where('company_name', $company->name)
                ->update(['is_active' => (bool) $company->is_active]);
        }

        return response()->json([
            'message' => 'Company status updated',
            'company' => $company,
        ]);
    }
}
