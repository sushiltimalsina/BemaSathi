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
  const token = sessionStorage.getItem("client_token");
  if (!token) {
    localStorage.removeItem("client_token");
    localStorage.removeItem("client_user");
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
