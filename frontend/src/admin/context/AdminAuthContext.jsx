import React, { createContext, useContext, useEffect, useState } from "react";

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    const saved = sessionStorage.getItem("admin_user");
    return saved ? JSON.parse(saved) : null;
  });

  const login = (adminData, token) => {
    localStorage.setItem("admin_token", token);
    localStorage.setItem("admin_user", JSON.stringify(adminData));
    sessionStorage.setItem("admin_token", token);
    sessionStorage.setItem("admin_user", JSON.stringify(adminData));
    setAdmin(adminData);
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    sessionStorage.removeItem("admin_token");
    sessionStorage.removeItem("admin_user");
    setAdmin(null);
  };

  useEffect(() => {
    const token = sessionStorage.getItem("admin_token");
    if (!token) {
      setAdmin(null);
    }
  }, []);

  return (
    <AdminAuthContext.Provider value={{ admin, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);
