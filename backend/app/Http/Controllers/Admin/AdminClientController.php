<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminClientController extends Controller
{
    public function index()
    {
        // Combine registered users with manually added clients
        $users = User::select('id', 'name', 'email', 'phone', 'address')
            ->get()
            ->map(function ($u) {
                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'phone' => $u->phone,
                    'address' => $u->address,
                    'policy_id' => null,
                    'policy_provided' => false,
                    'source' => 'user',
                ];
            });

        $clients = Client::with('policy')
            ->get()
            ->map(function ($c) {
                $data = array_merge($c->toArray(), ['source' => 'client']);
                if ($c->policy) {
                    $data['policy_name'] = $c->policy->policy_name;
                    $data['company_name'] = $c->policy->company_name;
                }
                return $data;
            });

        return response()->json($users->concat($clients)->values());
    }

    public function show($id)
    {
        $client = Client::with('policy')->find($id);
        if ($client) {
            $data = $client->toArray();
            if ($client->policy) {
                $data['policy_name'] = $client->policy->policy_name;
                $data['company_name'] = $client->policy->company_name;
            }
            $data['source'] = 'client';
            return response()->json($data);
        }

        $user = User::find($id);
        if ($user) {
            $data = $user->only(['id', 'name', 'email', 'phone', 'address']);
            $data['policy_id'] = null;
            $data['policy_provided'] = false;
            $data['source'] = 'user';
            return response()->json($data);
        }

        return response()->json(['message' => 'Client not found'], 404);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'             => 'required|string',
            'email'            => 'required|email',
            'phone'            => 'required|string',
            'address'          => 'nullable|string',
            'policy_id'        => 'nullable|exists:policies,id',
            'policy_provided'  => 'boolean',
        ]);

        $client = Client::create($validated);
        $client->load('policy');

        $response = [
            'message' => 'Client created successfully',
            'client'  => $client
        ];

        if ($client->policy) {
            $response['client']['policy_name'] = $client->policy->policy_name;
            $response['client']['company_name'] = $client->policy->company_name;
        }

        return response()->json($response, 201);
    }

    public function update(Request $request, $id)
    {
        // Try client record first
        $client = Client::find($id);
        if ($client) {
            $validated = $request->validate([
                'name'             => 'required|string',
                'email'            => 'required|email',
                'phone'            => 'required|string',
                'address'          => 'nullable|string',
                'policy_id'        => 'nullable|exists:policies,id',
                'policy_provided'  => 'boolean',
            ]);

            $client->update($validated);
            $client->load('policy');

            $response = [
                'message' => 'Client updated successfully',
                'client'  => $client
            ];

            if ($client->policy) {
                $response['client']['policy_name'] = $client->policy->policy_name;
                $response['client']['company_name'] = $client->policy->company_name;
            }

            return response()->json($response);
        }

        // Fall back to registered user (client_user table)
        $user = User::find($id);
        if (!$user) {
            return response()->json(['message' => 'Client not found'], 404);
        }

        $validated = $request->validate([
            'name'    => 'required|string',
            'email'   => 'required|email',
            'phone'   => 'required|string',
            'address' => 'nullable|string',
            'password'=> 'nullable|string|min:6',
        ]);

        $payload = $validated;
        if (!empty($validated['password'])) {
            $payload['password'] = Hash::make($validated['password']);
        } else {
            unset($payload['password']);
        }

        $user->update($payload);

        return response()->json([
            'message' => 'User updated successfully',
            'client'  => $user,
        ]);
    }

    public function destroy($id)
    {
        // Try deleting from clients table first
        $client = Client::find($id);
        if ($client) {
            $client->delete();
            return response()->json(['message' => 'Client deleted successfully']);
        }

        // Fall back to registered users (merged in index)
        $user = User::find($id);
        if ($user) {
            $user->delete();
            return response()->json(['message' => 'User deleted successfully']);
        }

        return response()->json(['message' => 'Client not found'], 404);
    }
}
