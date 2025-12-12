<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'esewa' => [
        'merchant_code' => env('ESEWA_MERCHANT_CODE', 'EPAYTEST'),
        // Default test secret; override in .env for production
        'secret_key'    => env('ESEWA_SECRET_KEY', '8gBm/:&EnhH.1/q'),
    ],

    'khalti' => [
        'public_key' => env('KHALTI_PUBLIC_KEY', '0a72abfa6016420d8ca6fb4a139e4a5f'),
        'secret_key' => env('KHALTI_SECRET_KEY', '6a781cba055c48ce984b5284abf0277f'),
        'base_url'   => env('KHALTI_BASE_URL', 'https://a.khalti.com/api/v2'),
    ],

];
