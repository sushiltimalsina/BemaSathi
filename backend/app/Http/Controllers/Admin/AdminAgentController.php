<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Agent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Schema;

class AdminAgentController extends Controller
{
    public function index()
    {
        return response()->json(Agent::with('company')->get());
    }

    public function show(Agent $agent)
    {
        return response()->json($agent);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'  => 'required|string',
            'phone' => 'required|string',
            'email' => 'required|email',
            'company_id' => 'nullable|exists:companies,id',
            'is_active' => 'nullable|boolean',
        ]);

        // Agents don't log in; assign a random placeholder password to satisfy DB constraint
        $validated['password'] = Hash::make(Str::random(12));

        $agent = Agent::create($validated);

        return response()->json([
            'message' => 'Agent created successfully',
            'agent'   => $agent->load('company')
        ], 201);
    }

    public function update(Request $request, Agent $agent)
    {
        $validated = $request->validate([
            'name'  => 'sometimes|required|string',
            'phone' => 'sometimes|required|string',
            'email' => 'sometimes|required|email',
            'company_id' => 'nullable|exists:companies,id',
            'is_active' => 'nullable|boolean',
        ]);

        $agent->update($validated);

        return response()->json([
            'message' => 'Agent updated successfully',
            'agent'   => $agent->load('company')
        ]);
    }

    public function destroy(Agent $agent)
    {
        $agent->delete();

        return response()->json([
            'message' => 'Agent deleted successfully'
        ]);
    }

    public function toggle(Agent $agent)
    {
        if (Schema::hasColumn('agents', 'is_active')) {
            $agent->is_active = !($agent->is_active ?? true);
            $agent->save();
        }

        return response()->json([
            'message' => 'Agent status updated',
            'agent' => $agent,
        ]);
    }
}
