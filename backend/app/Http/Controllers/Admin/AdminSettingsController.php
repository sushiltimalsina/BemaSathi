<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;

class AdminSettingsController extends Controller
{
    private string $file = 'admin_settings.json';
    private string $envFile = '.env';

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

    public function public()
    {
        if (Storage::disk('local')->exists($this->file)) {
            $content = json_decode(Storage::disk('local')->get($this->file), true);
        } else {
            $content = [];
        }

        return response()->json([
            'default_billing_cycle' => $content['default_billing_cycle']
                ?? env('DEFAULT_BILLING_CYCLE', 'yearly'),
            'renewal_grace_days' => $content['renewal_grace_days']
                ?? (int) env('RENEWAL_GRACE_DAYS', 7),
        ]);
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

        $this->updateEnv([
            'RENEWAL_GRACE_DAYS' => $data['renewal_grace_days'] ?? null,
            'DEFAULT_BILLING_CYCLE' => $data['default_billing_cycle'] ?? null,
            'ESEWA_MERCHANT_CODE' => $data['esewa_merchant_id'] ?? null,
            'ESEWA_SECRET_KEY' => $data['esewa_secret_key'] ?? null,
            'KHALTI_PUBLIC_KEY' => $data['khalti_public_key'] ?? null,
            'KHALTI_SECRET_KEY' => $data['khalti_secret_key'] ?? null,
            'MAIL_HOST' => $data['smtp_host'] ?? null,
            'MAIL_PORT' => $data['smtp_port'] ?? null,
            'MAIL_USERNAME' => $data['smtp_username'] ?? null,
            'MAIL_PASSWORD' => $data['smtp_password'] ?? null,
            'MAIL_FROM_NAME' => $data['mail_from_name'] ?? null,
            'MAIL_FROM_ADDRESS' => $data['mail_from_address'] ?? null,
            'APP_NAME' => $data['system_name'] ?? null,
            'APP_FRONTEND_URL' => $data['website_url'] ?? null,
        ]);

        config([
            'app.name' => $data['system_name'] ?? config('app.name'),
            'app.frontend_url' => $data['website_url'] ?? config('app.frontend_url'),
            'renewal_grace_days' => $data['renewal_grace_days'] ?? config('renewal_grace_days'),
            'default_billing_cycle' => $data['default_billing_cycle'] ?? config('default_billing_cycle'),
            'services.esewa.merchant_code' => $data['esewa_merchant_id'] ?? config('services.esewa.merchant_code'),
            'services.esewa.secret_key' => $data['esewa_secret_key'] ?? config('services.esewa.secret_key'),
            'services.khalti.public_key' => $data['khalti_public_key'] ?? config('services.khalti.public_key'),
            'services.khalti.secret_key' => $data['khalti_secret_key'] ?? config('services.khalti.secret_key'),
            'mail.mailers.smtp.host' => $data['smtp_host'] ?? config('mail.mailers.smtp.host'),
            'mail.mailers.smtp.port' => $data['smtp_port'] ?? config('mail.mailers.smtp.port'),
            'mail.mailers.smtp.username' => $data['smtp_username'] ?? config('mail.mailers.smtp.username'),
            'mail.mailers.smtp.password' => $data['smtp_password'] ?? config('mail.mailers.smtp.password'),
            'mail.from.name' => $data['mail_from_name'] ?? config('mail.from.name'),
            'mail.from.address' => $data['mail_from_address'] ?? config('mail.from.address'),
        ]);

        return response()->json([
            'message' => 'Settings saved successfully',
            'data' => $data,
        ]);
    }

    private function updateEnv(array $values): void
    {
        $path = base_path($this->envFile);
        if (!File::exists($path)) {
            return;
        }

        $content = File::get($path);

        foreach ($values as $key => $value) {
            if ($value === null) {
                continue;
            }
            $safe = $this->formatEnvValue($value);
            $pattern = "/^{$key}=.*$/m";

            if (preg_match($pattern, $content)) {
                $content = preg_replace($pattern, "{$key}={$safe}", $content);
            } else {
                $content .= PHP_EOL . "{$key}={$safe}";
            }
        }

        File::put($path, $content);
    }

    private function formatEnvValue($value): string
    {
        $string = (string) $value;
        $escaped = str_replace('"', '\"', $string);
        return "\"{$escaped}\"";
    }
}
