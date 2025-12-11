<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\PolicyController;
use App\Http\Controllers\ComparisonController;
use App\Http\Controllers\AgentController;
use App\Http\Controllers\InquiryController;
use App\Http\Controllers\AdminAuthController;
use App\Http\Controllers\BuyRequestController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\RecommendationController;
use App\Http\Controllers\PaymentController;

// Admin Controllers
use App\Http\Controllers\Admin\AdminPolicyController;
use App\Http\Controllers\Admin\AdminAgentController;
use App\Http\Controllers\Admin\AdminInquiryController;
use App\Http\Controllers\Admin\AdminBuyRequestController;
use App\Http\Controllers\Admin\AdminStatsController;
use App\Http\Controllers\Admin\AdminCompanyController;
use App\Http\Controllers\Admin\AdminClientController;
use App\Http\Controllers\SavedPolicyController;
use App\Http\Controllers\PremiumQuoteController;
use App\Http\Controllers\KycController;

/*
|--------------------------------------------------------------------------
| PUBLIC ROUTES
|--------------------------------------------------------------------------
*/

// User Authentication
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);
Route::post('/password/forgot', [PasswordResetController::class, 'forgot']);
Route::post('/password/reset',  [PasswordResetController::class, 'reset']);



// Public Policies
Route::get('/policies',          [PolicyController::class, 'index']);
Route::get('/policies/{policy}', [PolicyController::class, 'show']);

// Public Agents (read-only)
Route::get('/agents',         [AgentController::class, 'index']);
Route::get('/agents/{agent}', [AgentController::class, 'show']);

// Public inquiries (allow logging agent view without auth)
Route::post('/inquiries', [InquiryController::class, 'store']);

// Premium calculator (public, no auth needed)
Route::post('/premium/calculate', [PolicyController::class, 'calculatePremium']);
Route::post('/premium/quote', [PremiumQuoteController::class, 'quote']);

// eSewa callbacks (must be public for gateway)
Route::match(['GET', 'POST'], '/payments/{payment}/success', [PaymentController::class, 'success']);
Route::match(['GET', 'POST'], '/payments/{payment}/failed',  [PaymentController::class, 'failed']);

// Admin Login (PUBLIC)
Route::post('/admin/login', [AdminAuthController::class, 'login'])->name('login');

/*
|--------------------------------------------------------------------------
| PROTECTED ROUTES (USER + ADMIN)
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | USER ROUTES
    |--------------------------------------------------------------------------
    */

    // Authenticated user profile
    Route::get('/me',      [AuthController::class, 'me']);
    Route::put('/update-profile', [AuthController::class, 'updateProfile']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Saved Policies (Client only)
    Route::get('/saved',                [SavedPolicyController::class, 'index']);
    Route::post('/saved',               [SavedPolicyController::class, 'store']);
    Route::delete('/saved/{policy_id}', [SavedPolicyController::class, 'destroy']);

    // Recommendations (Client only)
    Route::get('/recommendations', [PolicyController::class, 'recommend']);
    Route::get('/recommendations/personal', [RecommendationController::class, 'index']);

    // User: Comparison
    Route::post('/compare', [ComparisonController::class, 'compare']);

    Route::post('/buy', [BuyRequestController::class, 'store']);
    Route::get('/my-requests', [BuyRequestController::class, 'userRequests']);

    // Payments (authenticated creation and view)
    Route::get('/payments/{payment}', [PaymentController::class, 'show']);
    Route::post('/payments', [PaymentController::class, 'create']);
    Route::post('/payments/{payment}/status', [PaymentController::class, 'updateStatus']);
    Route::post('/payments/esewa', [PaymentController::class, 'create']);


    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markRead']);

    Route::post('/kyc/submit', [KycController::class, 'submit']);
    Route::get('/kyc/me', [KycController::class, 'myKyc']);




    /*
    |--------------------------------------------------------------------------
    | ADMIN ROUTES (SANCTUM + ADMIN MIDDLEWARE)
    |--------------------------------------------------------------------------
    */

    Route::middleware(['admin'])->prefix('admin')->group(function () {

        // Admin Profile
        Route::get('/profile', function () {
            return auth()->user();
        });

        // Admin Stats
        Route::get('/stats', [AdminStatsController::class, 'stats']);

        // Admin Auth
        Route::post('/logout',   [AdminAuthController::class, 'logout']);
        Route::post('/register', [AdminAuthController::class, 'register']);

        /*
        |-------------------------
        | Policies (Admin Only)
        |-------------------------
        */
        Route::get('/policies',           [AdminPolicyController::class, 'index']);
        Route::post('/policies',          [AdminPolicyController::class, 'store']);
        Route::get('/policies/{policy}',  [AdminPolicyController::class, 'show']);
        Route::put('/policies/{policy}',  [AdminPolicyController::class, 'update']);
        Route::delete('/policies/{policy}', [AdminPolicyController::class, 'destroy']);

        /*
        |-------------------------
        | Agents (Admin Only)
        |-------------------------
        */
        Route::get('/agents',          [AdminAgentController::class, 'index']);
        Route::post('/agents',         [AdminAgentController::class, 'store']);
        Route::get('/agents/{agent}',  [AdminAgentController::class, 'show']);
        Route::put('/agents/{agent}',  [AdminAgentController::class, 'update']);
        Route::delete('/agents/{agent}', [AdminAgentController::class, 'destroy']);

        /*
        |-------------------------
        | Companies (Admin Only)
        |-------------------------
        */
        Route::get('/companies',             [AdminCompanyController::class, 'index']);
        Route::post('/companies',            [AdminCompanyController::class, 'store']);
        Route::get('/companies/{company}',   [AdminCompanyController::class, 'show']);
        Route::put('/companies/{company}',   [AdminCompanyController::class, 'update']);
        Route::delete('/companies/{company}', [AdminCompanyController::class, 'destroy']);

        /*
        |-------------------------
        | Clients (Admin Only)
        |-------------------------
        */
        Route::get('/clients',           [AdminClientController::class, 'index']);
        Route::post('/clients',          [AdminClientController::class, 'store']);
        Route::get('/clients/{client}',  [AdminClientController::class, 'show']);
        Route::put('/clients/{client}',  [AdminClientController::class, 'update']);
        Route::delete('/clients/{client}', [AdminClientController::class, 'destroy']);

        /*
        |-------------------------
        | Inquiries (Admin Only)
        |-------------------------
        */
        Route::get('/inquiries',          [AdminInquiryController::class, 'index']);
        Route::get('/inquiries/{inquiry}', [AdminInquiryController::class, 'show']);
        Route::delete('/inquiries/{inquiry}', [AdminInquiryController::class, 'destroy']);

        /*
        |-------------------------
        | Buy Requests (Admin Only)
        |-------------------------
        */
        Route::get('/buy-requests',                 [AdminBuyRequestController::class, 'index']);
        Route::get('/buy-requests/{buyRequest}',    [AdminBuyRequestController::class, 'show']);
        Route::put('/buy-requests/{buyRequest}',    [AdminBuyRequestController::class, 'update']);
        Route::delete('/buy-requests/{buyRequest}', [AdminBuyRequestController::class, 'destroy']);
        // KYC (Admin Only)
        Route::get('/kyc', [KycController::class, 'index']);
        Route::patch('/kyc/{id}/status', [KycController::class, 'updateStatus']);
        Route::get('/admin/kyc', [KycController::class, 'index']);

    });
});
