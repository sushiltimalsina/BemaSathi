import axios from "axios";

// Shared API client for user-facing requests.
// Falls back to same-origin /api, but can be overridden with Vite env var.
const configuredBase = import.meta.env.VITE_API_BASE_URL;
const backendBase = import.meta.env.VITE_BACKEND_URL;
const resolvedBase =
  configuredBase || (backendBase ? `${backendBase}/api` : "/api");

const API = axios.create({
  baseURL: resolvedBase,
  timeout: 15000,
});

// Attach client auth token (if present) to every request.
API.interceptors.request.use((config) => {
  // Check both sessionStorage and localStorage for token
  const token = sessionStorage.getItem("client_token") || localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Handle expired/invalid sessions globally.
// Any 401 means the token is gone or expired — clear state and send to login.
let clientLogoutTimer = null;
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";

    // Skip auth endpoints so login errors don't trigger a redirect loop
    const isAuthEndpoint =
      url.includes("/login") ||
      url.includes("/register") ||
      url.includes("/password") ||
      url.includes("/email");

    // Skip if already on the login/register page (prevents reload loop)
    const isAlreadyOnAuthPage =
      window.location.pathname === "/login" ||
      window.location.pathname === "/register" ||
      window.location.pathname.startsWith("/verify") ||
      window.location.pathname.startsWith("/reset");

    if (!isAuthEndpoint && !isAlreadyOnAuthPage && status === 401) {
      // Debounce: only redirect once even if multiple requests fail simultaneously
      clearTimeout(clientLogoutTimer);
      clientLogoutTimer = setTimeout(() => {
        const token =
          sessionStorage.getItem("client_token") ||
          localStorage.getItem("token");
        if (!token) return; // Already handled

        localStorage.removeItem("client_token");
        localStorage.removeItem("client_user");
        localStorage.removeItem("token");
        sessionStorage.removeItem("client_token");
        sessionStorage.removeItem("client_user");
        window.location.href = "/login?reason=session_expired";
      }, 500);
    }

    return Promise.reject(error);
  }
);

export default API;
