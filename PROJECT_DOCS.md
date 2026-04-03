# BeemaSathi Project Documentation

## Overview
BeemaSathi is a full-stack insurance marketplace and management platform. It supports public browsing, client self-service, and an admin console. The backend is built with Laravel and exposes REST APIs protected by Sanctum tokens. The frontend is a React SPA (Vite + Tailwind) that consumes those APIs.

Core flows:
- Browse policies and get premium estimates.
- Register/login, complete KYC, and submit buy requests.
- Make payments via eSewa or Khalti.
- Track renewals, notifications, and support tickets.
- Admins manage policies, agents, companies, clients, reports, and audits.

Repository root: `C:\xampp\htdocs\BemaSathi`

## Tech Stack
Backend:
- Laravel + Sanctum
- Eloquent ORM and migrations
- Mail (SMTP) + Blade templates
- Scheduled command for renewals

Frontend:
- React 19 + React Router
- Tailwind CSS
- Axios API client
- Recharts + Framer Motion

Payments:
- eSewa (RC v2 endpoints)
- Khalti (API v2)

## Directory Structure
- `backend/` Laravel API application
- `frontend/` React SPA
- `vendor/` PHP dependencies
- `composer.json` root composer config (Sanctum)

## Backend Architecture
### Authentication
- Client and admin both use Sanctum tokens.
- Admin access is enforced by `AdminMiddleware` and `AuditLogMiddleware`.
- Tokens are issued on login and stored client-side in sessionStorage.

### Models (Core Data)
- `User` (profile, recommendation fields, KYC link)
- `Admin` (admin login)
- `Policy` (insurance details, active flag, agent link)
- `BuyRequest` (policy purchase intent + billing/renewal fields)
- `Payment` (transaction details, verification fields)
- `KycDocument` (documents, status, allow_edit)
- `SupportTicket` / `SupportMessage`
- `Notification`
- `Agent`, `Company`, `Client`, `Inquiry`, `AgentInquiry`, `AuditLog`

### Services
- `PremiumCalculator`: premium computation from profile factors.
- `LeadDistributor`: assigns lowest-load agent to a buy request.
- `NotificationService`: stores notifications and optionally emails.

### Middleware
- `AdminMiddleware`: ensures the current authenticated model is an Admin.
- `AuditLogMiddleware`: records admin actions into `audit_logs`.

### Scheduled Command
- `renewals:process`: marks renewals due/expired, sends reminders.

## Backend API Reference
Base path: `/api`

### Public Routes
Auth:
- `POST /register`
- `POST /login`
- `POST /password/forgot`
- `POST /password/reset`

Policies + Agents:
- `GET /policies`
- `GET /policies/{policy}`
- `GET /agents`
- `GET /agents/{agent}`

Premium:
- `POST /premium/calculate`
- `POST /premium/quote`

Inquiries:
- `POST /inquiries`

Payment callbacks:
- `GET|POST /payments/{payment}/success`
- `GET|POST /payments/{payment}/failed`
- `GET|POST /payments/khalti/return/{payment}`

### Authenticated Client Routes
Profile:
- `GET /me`
- `PUT /update-profile`
- `POST /logout`

Saved Policies:
- `GET /saved`
- `POST /saved`
- `DELETE /saved/{policy_id}`

Recommendations:
- `GET /recommendations`
- `GET /recommendations/personal`

Comparison + Buy:
- `POST /compare`
- `GET /my-requests`
- `GET /buy-requests/{buyRequest}`
- `POST /buy`
- `POST /buy/preview`

Payments:
- `GET /my-payments`
- `GET /payments/{payment}`
- `POST /payments`
- `POST /payments/{payment}/status`
- `POST /payments/{payment}/cancel`
- `POST /payments/esewa`
- `POST /payments/khalti`
- `POST /payments/khalti/verify`

KYC:
- `POST /kyc/submit`
- `GET /kyc/me`

Support:
- `GET /support/my-tickets`
- `POST /support/create`
- `GET /support/unread-count`
- `GET /support/{ticket}`
- `POST /support/{ticket}/mark-seen`
- `POST /support/{ticket}/reply`

Agent inquiries:
- `POST /agent-inquiries`

### Admin Routes (auth + admin + audit)
Auth:
- `POST /htt/login`
- `POST /htt/logout`
- `POST /htt/register`
- `GET /htt/profile`
- `POST /htt/profile/change-password`

Dashboard:
- `GET /htt/stats`

Policies:
- `GET /htt/policies`
- `POST /htt/policies`
- `GET /htt/policies/{policy}`
- `PUT /htt/policies/{policy}`
- `DELETE /htt/policies/{policy}`
- `POST /htt/policies/{policy}/toggle`

Agents:
- `GET /htt/agents`
- `POST /htt/agents`
- `GET /htt/agents/{agent}`
- `PUT /htt/agents/{agent}`
- `DELETE /htt/agents/{agent}`
- `POST /htt/agents/{agent}/toggle`

Companies:
- `GET /htt/companies`
- `POST /htt/companies`
- `GET /htt/companies/{company}`
- `PUT /htt/companies/{company}`
- `DELETE /htt/companies/{company}`
- `POST /htt/companies/{company}/toggle`

Clients:
- `GET /htt/clients`
- `POST /htt/clients`
- `GET /htt/clients/{client}`
- `PUT /htt/clients/{client}`
- `DELETE /htt/clients/{client}`

Inquiries:
- `GET /htt/inquiries`
- `GET /htt/inquiries/{inquiry}`
- `DELETE /htt/inquiries/{inquiry}`

KYC:
- `GET /htt/kyc`
- `PATCH /htt/kyc/{id}/status`

Renewals:
- `GET /htt/renewals`
- `POST /htt/renewals/{buyRequest}/notify`

Payments:
- `GET /htt/payments`
- `POST /htt/payments/{payment}/verify`

Buy Requests:
- `GET /htt/buy-requests`
- `GET /htt/buy-requests/{buyRequest}`
- `PUT /htt/buy-requests/{buyRequest}`
- `DELETE /htt/buy-requests/{buyRequest}`

Users + KYC detail:
- `GET /htt/users`
- `GET /htt/users/{user}/kyc`
- `POST /htt/users/{user}/kyc-update`
- `POST /htt/users/{user}/kyc-allow-edit`

Notifications:
- `GET /htt/notifications`
- `POST /htt/notifications/send`

Reports:
- `POST /htt/reports/export`

Audit logs:
- `GET /htt/audit-logs`
- `GET /htt/audit-logs/export`

Settings:
- `GET /htt/settings`
- `POST /htt/settings`
- `GET /settings/public`

Support:
- `GET /htt/support`
- `GET /htt/support/unread-count`
- `GET /htt/support/{ticket}`
- `POST /htt/support/{ticket}/reply`
- `POST /htt/support/{ticket}/status`
- `POST /htt/support/{ticket}/mark-seen`

Agent inquiries:
- `GET /htt/agent-inquiries`
- `POST /htt/agent-inquiries/{agentInquiry}/notify`

## Premium Calculation
The backend uses `PremiumCalculator` to compute a quote based on:
- Age factor (younger -> lower)
- Smoker factor
- Health score
- Coverage type + family members
- Budget range

Endpoints:
- `POST /api/premium/calculate`
- `POST /api/premium/quote`

Required input:
- `policy_id`

Optional inputs:
- `age` or `dob`
- `is_smoker`
- `health_score`
- `coverage_type`
- `budget_range`
- `family_members`

If not supplied, the authenticated user profile and approved KYC are used.

Note on algorithms:
- All recommendation, comparison, and premium calculations are custom rule-based logic implemented in the backend.
- No external API or third-party algorithm is used for these calculations.

## Payments
### eSewa
- Creates a `Payment` record and returns a payload for eSewa RC v2.
- On success, the callback verifies transaction status and marks payment as verified.

### Khalti
- Initiates payment via API v2 with `payment_url`.
- Return URL verifies the payment status via lookup.

### Renewal logic
- A buy request can receive multiple payments.
- The first verified payment is treated as initial purchase; subsequent ones are renewals.
- Renewal date is advanced after verified renewal payments.

## KYC Flow
- Users upload documents and details via `POST /kyc/submit`.
- Admins approve/reject; approved KYC is locked unless `allow_edit` is granted.
- KYC updates can be tied to support ticket requests.

## Support System
- Users open tickets and exchange messages with admins.
- Read/unread states are tracked for both user and admin.
- Admins can update ticket status and reply.

## Notifications
- Stored in the `notifications` table.
- Created by system actions (payments, KYC, renewals) or admin broadcasts.
- Optional email sending via `NotificationService`.

## Frontend Architecture
### Routes
- Public pages: Home, Policies, Policy Details, About, Contact, FAQ.
- Auth pages: Login, Register, Reset Password.
- Client pages: Dashboard, Policies, Saved, Compare, KYC, Buy, Payments, Support.
- Admin pages: Dashboard, Policies, Agents, Companies, Users, Payments, Renewals, Reports.

### Layouts
- `ClientLayout`: client sidebar + content shell + chat bubble.
- `AdminLayout`: admin sidebar/topbar + toasts/confirm modals.

### Auth Handling
- Session tokens are stored in `sessionStorage`.
- Cross-tab sync via BroadcastChannel (`authBroadcast.js`).
- Guards: `ProtectedClientRoute`, `ProtectedAdminRoute`.
- `useIdleLogout` logs out after inactivity (admin side).

### API Clients
- `frontend/src/api/api.js` for client API requests.
- `frontend/src/admin/utils/adminApi.js` for admin API requests.

## Configuration
Backend environment variables (examples):
- `APP_FRONTEND_URL`
- `ESEWA_MERCHANT_CODE`, `ESEWA_SECRET_KEY`, `ESEWA_ENV`
- `KHALTI_PUBLIC_KEY`, `KHALTI_SECRET_KEY`, `KHALTI_BASE_URL`
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`
- `RENEWAL_GRACE_DAYS`, `DEFAULT_BILLING_CYCLE`

Frontend environment:
- `VITE_API_BASE_URL` (optional override)

## Known Implementation Notes
- Multiple migrations touch buy_request pricing fields. Ensure migrations are applied in order and guard against duplicates.
- Premium endpoints now map to dedicated controllers for quote generation.

Recent changes (documentation + backend fixes):
- Added `PROJECT_DOCS.md` as a dedicated project documentation file.
- Fixed `/api/premium/quote` by implementing `backend/app/Http/Controllers/PremiumQuoteController.php` with a real `quote()` method using `PremiumCalculator`.
- Implemented the missing `/api/premium/calculate` handler in `backend/app/Http/Controllers/PolicyController.php` (`calculatePremium()`), matching the existing route.
- Hardened migration `backend/database/migrations/2025_12_11_174545_add_billing_cycle_to_buy_requests_table.php` with `Schema::hasColumn` checks and a reversible `down()` to reduce conflicts with other migrations.
- Documented that algorithms are custom rule-based logic (not external API / not ML).
- Added `encoded_id` obfuscation strategy to disguise primary database identifiers (base64 + XOR) on frontend URLs to deter ID enumeration and improve security.
- Migrated admin interface URLs and internal API paths from `/admin/*` to `/htt/*` to implement security through obscurity for sensitive management routes.
- Enhanced Admin Profile with a secure, modal-based password rotation flow (`/htt/profile/change-password`).
- Refactored Agent creation workflow: removed manual password requirements (auto-generates securely via backend), simplified the UI, and added a robust company assignment selector.
- Updated `pdfs/payment-receipt.blade.php` to greet the client by name (`$userName`) instead of the generic fallback "there".
- Added client email address (`$userEmail`) as a visible row in the payment receipt PDF, surfaced from both the Client and Admin download endpoints.
- Removed unused `agent_id` field from `BuyRequest` model (`$fillable`) and its `agent()` relation — no agent was ever auto-assigned to buy requests.
- Created migration `2026_03_28_000001_drop_agent_id_from_buy_requests_table.php` to safely drop the `agent_id` column from `buy_requests` with `Schema::hasColumn` guards.
- Deleted orphaned `app/Services/LeadDistributor.php` — it had zero active usages in the codebase.
- **Security:** Moved public Agent contact routes (`GET /agents`, `GET /agents/{agent}`) behind `auth:sanctum` to prevent data scraping of unauthenticated guests.
- **Guest Inquiries:** Overhauled generic `ContactUs.jsx` form. Integrated real-time, dynamic frontend inline validation (onBlur checks + onChange auto-clearing) for Name, Email, Phone, and Message length.
- **Guest Inquiries:** Added a live dynamic dropdown to the generic contact form allowing guests to optionally link an existing Policy to their message.
- **Guest Inquiries:** Created migration `2026_03_31_000000_make_fields_nullable_in_inquiries_table.php` to drop strict constraints on `policy_id` and `phone`, mapping form payloads dynamically without DB crashes.
- **Admin Dashboard:** Built robust `GuestInquiryList.jsx` for admins to review Guest contact messages, complete with nested `mailto:` (Reply) and `tel:` (Call) action buttons natively rendered based on user-provided data.

## Quick Start (Local)
Backend (Laravel):
- Configure `backend/.env`
- Run migrations and seeders
- Serve Laravel API

Frontend (React):
- `cd frontend`
- `npm install`
- `npm run dev`

---
End of document.
