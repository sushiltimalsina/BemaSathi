import axios from "axios";

// Allow overriding API base via env; default to same-origin /api (works with Vite proxy)
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
});

// Attach token automatically
API.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("admin_token");
  if (!token) {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
  }
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle auth errors globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";
    const isAuthRequest = url.includes("/admin/login");
    if (!isAuthRequest && (status === 401 || status === 419)) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
      sessionStorage.removeItem("admin_token");
      sessionStorage.removeItem("admin_user");
      window.location.href = "/admin/login";
    }
    return Promise.reject(error);
  }
);

// -------- AUTH --------
export const adminLogin = ({ email, password }) =>
  API.post("/admin/login", { email, password });

export const adminLogout = () => API.post("/admin/logout");

// -------- DASHBOARD --------
export const getAdminStats = () => API.get("/admin/stats");
export const getAdminProfile = () => API.get("/admin/profile");

// -------- POLICIES (Admin Protected) --------
export const fetchPolicies = () => API.get("/admin/policies");
export const addPolicy = (data) => API.post("/admin/policies", data);
export const updatePolicy = (id, data) => API.put(`/admin/policies/${id}`, data);
export const deletePolicy = (id) => API.delete(`/admin/policies/${id}`);

// -------- COMPANIES (Admin Protected) --------
export const fetchCompanies = () => API.get("/admin/companies");
export const addCompany = (data) => API.post("/admin/companies", data);
export const updateCompany = (id, data) => API.put(`/admin/companies/${id}`, data);
export const deleteCompany = (id) => API.delete(`/admin/companies/${id}`);

// -------- AGENTS (Admin Protected) --------
export const fetchAgents = () => API.get("/admin/agents");
export const addAgent = (data) => API.post("/admin/agents", data);
export const updateAgent = (id, data) => API.put(`/admin/agents/${id}`, data);
export const deleteAgent = (id) => API.delete(`/admin/agents/${id}`);

// -------- KYC (Admin Protected) --------
export const fetchKycList = (status) =>
  API.get("/admin/kyc", status ? { params: { status } } : undefined);
export const updateKycStatus = (id, payload) =>
  API.patch(`/admin/kyc/${id}/status`, payload);

// export axios instance
export { API as adminApi };
export default API;
