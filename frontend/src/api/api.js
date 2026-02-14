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

  if (!token) {
    // Optional: Only log if needed, no need to clean every time
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default API;
