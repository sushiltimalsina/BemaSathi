<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BuyRequestController;
use App\Http\Controllers\PolicyController;
use App\Http\Controllers\ComparisonController;
use App\Http\Controllers\AgentController;
use App\Http\Controllers\InquiryController;
use App\Http\Controllers\AdminAuthController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\RecommendationController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\Admin\AdminPaymentController;
use App\Http\Controllers\Admin\AdminRenewalController;
use App\Http\Controllers\Admin\AdminNotificationController;
use App\Http\Controllers\Admin\AdminReportController;
use App\Http\Controllers\Admin\AdminAuditController;
use App\Http\Controllers\Admin\AdminSettingsController;
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\Admin\AdminSupportController;
use App\Http\Controllers\Admin\AdminAgentInquiryController;
use App\Http\Controllers\SupportController;
use App\Http\Controllers\AgentInquiryController;

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
// Khalti return (public)
Route::match(['GET', 'POST'], '/payments/khalti/return/{payment}', [PaymentController::class, 'khaltiReturn']);

// Admin Login (PUBLIC)
Route::post('/admin/login', [AdminAuthController::class, 'login'])->name('login');
Route::get('/settings/public', [AdminSettingsController::class, 'public']);

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
    Route::get('/my-requests', [BuyRequestController::class, 'userRequests']);
    Route::get('/buy-requests/{buyRequest}', [BuyRequestController::class, 'show']);
    Route::post('/buy', [BuyRequestController::class, 'store']);
    Route::post('/buy/preview', [BuyRequestController::class, 'preview']);



    // Payments (authenticated creation and view)
    Route::get('/my-payments', [PaymentController::class, 'myPayments']);
    Route::get('/payments/{payment}', [PaymentController::class, 'show']);
    Route::post('/payments', [PaymentController::class, 'create']);
    Route::post('/payments/{payment}/status', [PaymentController::class, 'updateStatus']);
    Route::post('/payments/{payment}/cancel', [PaymentController::class, 'cancel']);
    Route::post('/payments/esewa', [PaymentController::class, 'create']);
    Route::post('/payments/khalti', [PaymentController::class, 'createKhalti']);
    Route::post('/payments/khalti/verify', [PaymentController::class, 'verifyKhalti']);


    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::match(['put', 'post'], '/notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);

    Route::post('/kyc/submit', [KycController::class, 'submit']);
    Route::get('/kyc/me', [KycController::class, 'myKyc']);

    // Support (Client)
    Route::get('/support/my-tickets', [SupportController::class, 'myTickets']);
    Route::post('/support/create', [SupportController::class, 'create']);
    Route::get('/support/unread-count', [SupportController::class, 'unreadCount']);
    Route::get('/support/{ticket}', [SupportController::class, 'show']);
    Route::post('/support/{ticket}/mark-seen', [SupportController::class, 'markSeen']);
    Route::post('/support/{ticket}/reply', [SupportController::class, 'reply']);

    // Agent inquiries (Client)
    Route::post('/agent-inquiries', [AgentInquiryController::class, 'store']);




    /*
    |--------------------------------------------------------------------------
    | ADMIN ROUTES (SANCTUM + ADMIN MIDDLEWARE)
    |--------------------------------------------------------------------------
    */

    Route::middleware(['admin', 'audit'])->prefix('admin')->group(function () {

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
        Route::post('/policies/{policy}/toggle', [AdminPolicyController::class, 'toggle']);

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
        Route::post('/agents/{agent}/toggle', [AdminAgentController::class, 'toggle']);

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
        Route::post('/companies/{company}/toggle', [AdminCompanyController::class, 'toggle']);

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

        // KYC (Admin Only)
        Route::get('/kyc', [KycController::class, 'index']);
        Route::patch('/kyc/{id}/status', [KycController::class, 'updateStatus']);
        Route::get('/admin/kyc', [KycController::class, 'index']);

        /*
        |-------------------------
        | Renewals & Payments
        |-------------------------
        */
        Route::get('/renewals', [AdminRenewalController::class, 'index']);
        Route::post('/renewals/{buyRequest}/notify', [AdminRenewalController::class, 'notify']);
        Route::get('/payments', [AdminPaymentController::class, 'index']);
        Route::post('/payments/{payment}/verify', [AdminPaymentController::class, 'verify']);
        Route::get('/agent-inquiries', [AdminAgentInquiryController::class, 'index']);
        Route::post('/agent-inquiries/{agentInquiry}/notify', [AdminAgentInquiryController::class, 'notify']);

        /*
        |-------------------------
        | Buy Requests (Admin Only)
        |-------------------------
        */
        Route::get('/buy-requests',                 [AdminBuyRequestController::class, 'index']);
        Route::get('/buy-requests/{buyRequest}',    [AdminBuyRequestController::class, 'show']);
        Route::put('/buy-requests/{buyRequest}',    [AdminBuyRequestController::class, 'update']);
        Route::delete('/buy-requests/{buyRequest}', [AdminBuyRequestController::class, 'destroy']);

        /*
        |-------------------------
        | Users & KYC detail
        |-------------------------
        */
        Route::get('/users', [AdminUserController::class, 'index']);
        Route::get('/users/{user}/kyc', [AdminUserController::class, 'kyc']);
        Route::post('/users/{user}/kyc-update', [AdminUserController::class, 'updateKycStatus']);
        Route::post('/users/{user}/kyc-allow-edit', [AdminUserController::class, 'allowKycEdit']);

        /*
        |-------------------------
        | Notifications
        |-------------------------
        */
        Route::get('/notifications', [AdminNotificationController::class, 'index']);
        Route::post('/notifications/send', [AdminNotificationController::class, 'send']);

        /*
        |-------------------------
        | Reports & Audit Logs
        |-------------------------
        */
        Route::post('/reports/export', [AdminReportController::class, 'export']);
        Route::get('/audit-logs', [AdminAuditController::class, 'index']);
        Route::get('/audit-logs/export', [AdminAuditController::class, 'export']);

        /*
        |-------------------------
        | Settings
        |-------------------------
        */
        Route::get('/settings', [AdminSettingsController::class, 'show']);
        Route::post('/settings', [AdminSettingsController::class, 'update']);

        /*
        |-------------------------
        | Support
        |-------------------------
        */
        Route::get('/support', [AdminSupportController::class, 'index']);
        Route::get('/support/unread-count', [AdminSupportController::class, 'unreadCount']);
        Route::get('/support/{ticket}', [AdminSupportController::class, 'show']);
        Route::post('/support/{ticket}/reply', [AdminSupportController::class, 'reply']);
        Route::post('/support/{ticket}/status', [AdminSupportController::class, 'updateStatus']);
        Route::post('/support/{ticket}/mark-seen', [AdminSupportController::class, 'markSeen']);

    });
});
