<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_unique(array_filter(array_map('trim', array_merge(
        explode(',', (string) env('CORS_ALLOWED_ORIGINS', '')),
        [
            (string) env('APP_FRONTEND_URL', ''),
            (string) env('ADMIN_FRONTEND_URL', ''),
        ]
    ))))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];
