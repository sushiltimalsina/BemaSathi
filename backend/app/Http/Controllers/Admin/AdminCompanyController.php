<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

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
        ]);

        $company = Company::create($validated);

        return response()->json([
            'message' => 'Company created successfully',
            'company' => $company
        ], 201);
    }

    public function update(Request $request, Company $company)
    {
        $validated = $request->validate([
            'name'        => 'required|string',
            'email'       => 'required|email',
            'phone'       => 'required|string',
            'address'     => 'nullable|string',
            'description' => 'nullable|string',
            'agent_id'    => 'nullable|exists:agents,id',
        ]);

        $company->update($validated);

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

        return response()->json([
            'message' => 'Company status updated',
            'company' => $company,
        ]);
    }
}
