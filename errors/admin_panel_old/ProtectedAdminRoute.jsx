import React from "react";
import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

const ProtectedAdminRoute = ({ children }) => {
  const { admin } = useAdminAuth();
  const hasToken = !!localStorage.getItem("admin_token");

  if (!admin || !hasToken) {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default ProtectedAdminRoute;
