import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedAdminRoute = ({ children }) => {
  const hasToken = !!localStorage.getItem("admin_token");

  if (!hasToken) {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    return <Navigate to="/admin/login" replace />;
  }

  // Support both wrapper usage (<ProtectedAdminRoute><Layout/></ProtectedAdminRoute>)
  // and route element usage (<Route element={<ProtectedAdminRoute />} />)
  return children || <Outlet />;
};

export default ProtectedAdminRoute;
