# BeemaSathi Frontend

The frontend for the **BeemaSathi** insurance management platform. Developed using React 19, Vite, and Tailwind CSS.

## 🚀 Quick Start
1. Ensure the Laravel backend is running.
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`

## 🏗️ Architecture

- **Public Views:** Interactive homepage, policy exploration, and user authentication workflows. Designed with responsive, modern Tailwind CSS aesthetics.
- **Client Dashboard (`/client/*`):** Secure self-service portal for purchasing policies, reviewing active coverage, submitting KYC documents, executing payments, and opening support tickets.
- **Admin Command Center (`/htt/*`):** Administrative portal for managing policies, assigning agents to companies, verifying KYC submissions, and tracking renewals. Protected by comprehensive authentication and audit logging.

## 🔒 Security Implementations
- **ID Obfuscation:** Critical database records are dynamically hashed (via XOR & Base64 encoding) inside URL parameters to prevent ID enumeration. The application handles graceful seamless redirects.
- **Route Obscurity:** All legacy `/admin/` routes and API calls have been hardened and migrated to a custom `/htt/` prefix.
- **State Syncer:** Automatically logs users/admins out of all sessions after inactivity using `useIdleLogout` and cross-tab synchronization.

## 📂 Core Directory Structure

```text
src/
├── admin/          # Admin portal components, views, and layout wrappers 
├── api/            # Client-side Axios API interactions
├── components/     # High-level shared building blocks (Navbar, Footer)
├── context/        # Global React Context providers (Theme, Compare)
├── hooks/          # Custom hooks (useIdleLogout)
├── ui/             # Reusable UI primitives (Buttons, Modals, Forms)
├── user/           # Public & authenticated client views (Guest, Dashboard)
└── utils/          # Formatting pipelines, auth broadcasters, etc.
```

## 🛠 Tech Stack
- **React 19** 
- **React Router**
- **Tailwind CSS** (for styling & micro-animations)
- **Vite** (build tool)
- **Axios** (intercept-driven API architecture)
- **Recharts** (data visualization)
