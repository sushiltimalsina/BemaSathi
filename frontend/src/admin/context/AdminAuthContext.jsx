import React, { createContext, useContext, useEffect, useState } from "react";
import { broadcastAuthUpdate, broadcastLogout } from "../../utils/authBroadcast";

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    const saved = sessionStorage.getItem("admin_user");
    return saved ? JSON.parse(saved) : null;
  });

  const login = (adminData, token) => {
    sessionStorage.setItem("admin_token", token);
    sessionStorage.setItem("admin_user", JSON.stringify(adminData));
    broadcastAuthUpdate("admin", token, JSON.stringify(adminData));
    setAdmin(adminData);
  };

  const logout = () => {
    sessionStorage.removeItem("admin_token");
    sessionStorage.removeItem("admin_user");
    broadcastLogout("admin");
    setAdmin(null);
  };

  useEffect(() => {
    const token = sessionStorage.getItem("admin_token");
    if (!token) {
      setAdmin(null);
    }
  }, []);

  useEffect(() => {
    const syncAdmin = () => {
      const raw = sessionStorage.getItem("admin_user");
      setAdmin(raw ? JSON.parse(raw) : null);
    };
    window.addEventListener("auth-sync", syncAdmin);
    return () => window.removeEventListener("auth-sync", syncAdmin);
  }, []);

  return (
    <AdminAuthContext.Provider value={{ admin, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);
