import axios from "axios";
import { broadcastLogout } from "../../utils/authBroadcast";

// Allow overriding API base via env; default to same-origin /api (works with Vite proxy)
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
});

// Attach token and handle path translation automatically
API.interceptors.request.use((config) => {
  // Translate legacy /admin/ paths to /htt/ (Security through obscurity)
  if (config.url?.startsWith("/admin/")) {
    config.url = config.url.replace("/admin/", "/htt/");
  }

  const token = sessionStorage.getItem("admin_token");
  if (!token) {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
  }
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});


// Handle auth errors globally
let logoutTimer = null;

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";
    const isAuthRequest = url.includes("/htt/login");
    const isReadonly = ["GET", "HEAD"].includes((error.config?.method || "").toUpperCase());

    if (!isAuthRequest && (status === 401 || status === 419)) {
      // For write operations (POST/PUT/DELETE) that fail, don't immediately log out.
      // It could be a CSRF or transient issue. Give a grace window.
      if (!isReadonly) {
        // For non-GET requests (like saving a policy), just reject — don't logout
        return Promise.reject(error);
      }

      // For read requests: debounce — only logout if still unauthorized after 3s
      clearTimeout(logoutTimer);
      logoutTimer = setTimeout(() => {
        const token = sessionStorage.getItem("admin_token");
        if (!token) return; // Already logged out
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
        sessionStorage.removeItem("admin_token");
        sessionStorage.removeItem("admin_user");
        broadcastLogout("admin");
        window.location.href = "/htt/login";
      }, 3000);
    }
    return Promise.reject(error);
  }
);

// -------- AUTH --------
export const adminLogin = ({ email, password }) =>
  API.post("/htt/login", { email, password });

export const adminLogout = () => API.post("/htt/logout");

// -------- DASHBOARD --------
export const getAdminStats = () => API.get("/htt/stats");
export const getAdminProfile = () => API.get("/htt/profile");

// -------- POLICIES (Admin Protected) --------
export const fetchPolicies = () => API.get("/htt/policies");
export const addPolicy = (data) => API.post("/htt/policies", data);
export const updatePolicy = (id, data) => API.put(`/htt/policies/${id}`, data);
export const deletePolicy = (id) => API.delete(`/htt/policies/${id}`);

// -------- COMPANIES (Admin Protected) --------
export const fetchCompanies = () => API.get("/htt/companies");
export const addCompany = (data) => API.post("/htt/companies", data);
export const updateCompany = (id, data) => API.put(`/htt/companies/${id}`, data);
export const deleteCompany = (id) => API.delete(`/htt/companies/${id}`);

// -------- AGENTS (Admin Protected) --------
export const fetchAgents = () => API.get("/htt/agents");
export const addAgent = (data) => API.post("/htt/agents", data);
export const updateAgent = (id, data) => API.put(`/htt/agents/${id}`, data);
export const deleteAgent = (id) => API.delete(`/htt/agents/${id}`);

// -------- KYC (Admin Protected) --------
export const fetchKycList = (status) =>
  API.get("/htt/kyc", status ? { params: { status } } : undefined);
export const updateKycStatus = (id, payload) =>
  API.patch(`/htt/kyc/${id}/status`, payload);

// export axios instance
export { API as adminApi };
export default API;
