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
            'name'  => 'required|string|max:255',
            'phone' => 'required|string|max:20', // Consider adding unique:agents,phone if applicable
            'email' => 'required|email|unique:agents,email',
            'password' => 'required|string|min:8',
            'company_id' => 'nullable|exists:companies,id',
            'is_active' => 'boolean',
        ]);

        $status = $request->has('is_active') ? $request->boolean('is_active') : true;

        $password = $validated['password'];
        $validated['password'] = Hash::make($password);
        $validated['is_active'] = $status;

        $agent = Agent::create($validated);

        // Send Welcome Email
        try {
            \Illuminate\Support\Facades\Mail::to($agent->email)->send(new \App\Mail\AgentWelcomeMail($agent));
        } catch (\Exception $e) {
            // Log error but don't fail the request
            \Illuminate\Support\Facades\Log::error('Failed to send agent welcome email: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Agent created successfully and notified via email.',
            'agent'   => $agent->load('company')
        ], 201);
    }

    public function update(Request $request, Agent $agent)
    {
        $validated = $request->validate([
            'name'  => 'sometimes|required|string|max:255',
            'phone' => 'sometimes|required|string|max:20',
            'email' => 'sometimes|required|email|unique:agents,email,' . $agent->id,
            'company_id' => 'nullable|exists:companies,id',
            'is_active' => 'boolean',
            'password' => 'nullable|string|min:8',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

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
