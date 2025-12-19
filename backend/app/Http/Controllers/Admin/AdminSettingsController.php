<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AdminSettingsController extends Controller
{
    private string $file = 'admin_settings.json';

    public function show()
    {
        if (Storage::disk('local')->exists($this->file)) {
            $content = json_decode(Storage::disk('local')->get($this->file), true);
        } else {
            $content = [];
        }

        $defaults = [
            'renewal_grace_days' => 7,
            'default_billing_cycle' => 'yearly',
            'esewa_merchant_id' => env('ESEWA_MERCHANT_CODE', ''),
            'esewa_secret_key' => env('ESEWA_SECRET_KEY', ''),
            'khalti_public_key' => env('KHALTI_PUBLIC_KEY', ''),
            'khalti_secret_key' => env('KHALTI_SECRET_KEY', ''),
            'smtp_host' => env('MAIL_HOST', ''),
            'smtp_port' => env('MAIL_PORT', 587),
            'smtp_username' => env('MAIL_USERNAME', ''),
            'smtp_password' => env('MAIL_PASSWORD', ''),
            'mail_from_name' => env('MAIL_FROM_NAME', config('app.name')),
            'mail_from_address' => env('MAIL_FROM_ADDRESS', ''),
            'system_name' => config('app.name', 'BeemaSathi'),
            'website_url' => env('APP_FRONTEND_URL', config('app.url')),
        ];

        return response()->json(array_merge($defaults, $content));
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'renewal_grace_days' => 'nullable|numeric',
            'default_billing_cycle' => 'nullable|string',
            'esewa_merchant_id' => 'nullable|string',
            'esewa_secret_key' => 'nullable|string',
            'khalti_public_key' => 'nullable|string',
            'khalti_secret_key' => 'nullable|string',
            'smtp_host' => 'nullable|string',
            'smtp_port' => 'nullable|numeric',
            'smtp_username' => 'nullable|string',
            'smtp_password' => 'nullable|string',
            'mail_from_name' => 'nullable|string',
            'mail_from_address' => 'nullable|string',
            'system_name' => 'nullable|string',
            'website_url' => 'nullable|string',
        ]);

        Storage::disk('local')->put($this->file, json_encode($data));

        return response()->json([
            'message' => 'Settings saved successfully',
            'data' => $data,
        ]);
    }
}
