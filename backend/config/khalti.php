<?php

    // config/khalti.php
return [
    'secret_key' => env('KHALTI_SECRET_KEY'),
    'public_key' => env('KHALTI_PUBLIC_KEY'), // if needed for frontend
    'verify_url' => 'https://khalti.com/api/v2/payment/verify/',
];
