import axios from "axios";

// Shared API client for user-facing requests.
// Falls back to same-origin /api, but can be overridden with Vite env var.
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
});

// Attach client auth token (if present) to every request.
API.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("client_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;

