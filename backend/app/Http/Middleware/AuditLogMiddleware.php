<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use Closure;
use Illuminate\Http\Request;

class AuditLogMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        $admin = $request->user();
        if (!$admin) {
            return $response;
        }

        $path = trim($request->path(), '/');
        if (str_starts_with($path, 'api/admin/audit-logs')) {
            return $response;
        }
        $segments = explode('/', $path);
        $isAdminRoute = isset($segments[0], $segments[1]) && $segments[0] === 'api' && $segments[1] === 'admin';
        $resource = $isAdminRoute ? ($segments[2] ?? 'admin') : ($segments[0] ?? 'admin');
        $last = end($segments);
        $method = strtoupper($request->method());

        $action = match (true) {
            $last === 'toggle' => 'toggle',
            $last === 'verify' => 'verify',
            $last === 'status' => 'status',
            $method === 'GET' => 'view',
            $method === 'POST' => 'create',
            $method === 'PUT' || $method === 'PATCH' => 'update',
            $method === 'DELETE' => 'delete',
            default => 'action',
        };

        $event = "{$resource}_{$action}";
        $resourceLabel = ucwords(str_replace('-', ' ', $resource));
        $actionLabel = match ($action) {
            'view' => 'viewed',
            'create' => 'created',
            'update' => 'updated',
            'delete' => 'deleted',
            'toggle' => 'toggled',
            'verify' => 'verified',
            'status' => 'status changed',
            default => 'updated',
        };
        $id = null;
        foreach ($segments as $segment) {
            if (ctype_digit($segment)) {
                $id = $segment;
                break;
            }
        }
        $description = trim("{$resourceLabel} {$actionLabel}" . ($id ? " (ID: {$id})" : ''));

        try {
            AuditLog::create([
                'admin_id' => $admin->id,
                'admin_name' => $admin->name ?? $admin->email ?? 'Admin',
                'event' => $event,
                'category' => $resource,
                'description' => $description,
            ]);
        } catch (\Throwable $e) {
            // Avoid breaking requests if audit logging fails.
        }

        return $response;
    }
}
