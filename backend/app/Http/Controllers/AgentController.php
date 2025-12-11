<?php

namespace App\Http\Controllers;

use App\Models\Agent;
use Illuminate\Http\Request;

class AgentController extends Controller
{
    public function index()
    {
        return response()->json(Agent::with('company')->get());
    }

    public function show(Agent $agent)
    {
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
