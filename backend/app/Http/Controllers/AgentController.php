<?php

namespace App\Http\Controllers;

use App\Models\Agent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class AgentController extends Controller
{
    public function index()
    {
        $agents = Agent::with('company')
            ->when(Schema::hasColumn('agents', 'is_active'), function ($query) {
                $query->where('is_active', true);
            })
            ->get();

        return response()->json($agents);
    }

    public function show(Agent $agent)
    {
        if (Schema::hasColumn('agents', 'is_active') && !$agent->is_active) {
            return response()->json(['message' => 'Agent not found'], 404);
        }

        $agent->load('company');
        return response()->json($agent);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string',
            'phone' => 'required|string',
            'email' => 'required|email',
            'password' => 'required|string'
        ]);

        $data['password'] = bcrypt($data['password']);

        $agent = Agent::create($data);

        return response()->json($agent);
    }

    public function update(Request $request, Agent $agent)
    {
        $agent->update($request->all());
        return response()->json($agent);
    }

    public function destroy(Agent $agent)
    {
        $agent->delete();
        return response()->json(['message' => 'Agent deleted']);
    }
}
