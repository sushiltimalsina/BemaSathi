<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Mail;

class AdminSettingsController extends Controller
{
    private string $file = 'admin_settings.json';
    private string $envFile = '.env';

    public function show(Request $request)
    {
        if (Storage::disk('local')->exists($this->file)) {
            $content = json_decode(Storage::disk('local')->get($this->file), true);
        } else {
            $content = [];
        }

        $envValues = $request->query('source') === 'env'
            ? $this->readEnvFile()
            : [];

        $defaults = [
            'renewal_grace_days' => 7,
            'default_billing_cycle' => 'yearly',
            'esewa_merchant_id' => $envValues['ESEWA_MERCHANT_CODE']
                ?? env('ESEWA_MERCHANT_CODE', ''),
            'esewa_secret_key' => $envValues['ESEWA_SECRET_KEY']
                ?? env('ESEWA_SECRET_KEY', ''),
            'khalti_public_key' => $envValues['KHALTI_PUBLIC_KEY']
                ?? env('KHALTI_PUBLIC_KEY', ''),
            'khalti_secret_key' => $envValues['KHALTI_SECRET_KEY']
                ?? env('KHALTI_SECRET_KEY', ''),
            'smtp_host' => $envValues['MAIL_HOST']
                ?? env('MAIL_HOST', ''),
            'smtp_port' => $envValues['MAIL_PORT']
                ?? env('MAIL_PORT', 587),
            'smtp_username' => $envValues['MAIL_USERNAME']
                ?? env('MAIL_USERNAME', ''),
            'smtp_password' => $envValues['MAIL_PASSWORD']
                ?? env('MAIL_PASSWORD', ''),
            'mail_from_name' => $envValues['MAIL_FROM_NAME']
                ?? env('MAIL_FROM_NAME', config('app.name')),
            'mail_from_address' => $envValues['MAIL_FROM_ADDRESS']
                ?? env('MAIL_FROM_ADDRESS', ''),
            'system_name' => $envValues['APP_NAME']
                ?? config('app.name', 'BeemaSathi'),
            'website_url' => $envValues['APP_FRONTEND_URL']
                ?? env('APP_FRONTEND_URL', config('app.url')),
        ];

        if ($request->query('source') === 'env') {
            return response()->json($defaults);
        }

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

        $fromAddress = $data['mail_from_address'] ?? config('mail.from.address');
        $fromName = $data['mail_from_name'] ?? config('mail.from.name');
        if ($fromAddress) {
            Mail::alwaysFrom($fromAddress, $fromName);
        }

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

    private function readEnvFile(): array
    {
        $path = base_path($this->envFile);
        if (!File::exists($path)) {
            return [];
        }

        $lines = preg_split("/\r\n|\n|\r/", (string) File::get($path));
        $values = [];

        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }

            $parts = explode('=', $line, 2);
            if (count($parts) !== 2) {
                continue;
            }

            [$key, $value] = $parts;
            $key = trim($key);
            $value = trim($value);

            if ($key === '') {
                continue;
            }

            if (
                (str_starts_with($value, '"') && str_ends_with($value, '"')) ||
                (str_starts_with($value, "'") && str_ends_with($value, "'"))
            ) {
                $value = substr($value, 1, -1);
            }

            $values[$key] = $value;
        }

        return $values;
    }
}
