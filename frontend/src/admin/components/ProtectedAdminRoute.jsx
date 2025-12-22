import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedAdminRoute = ({ children }) => {
  const hasToken = !!sessionStorage.getItem("admin_token");

  if (!hasToken) {
    sessionStorage.removeItem("admin_token");
    sessionStorage.removeItem("admin_user");
    return <Navigate to="/admin/login" replace />;
  }

  // Support both wrapper usage (<ProtectedAdminRoute><Layout/></ProtectedAdminRoute>)
  // and route element usage (<Route element={<ProtectedAdminRoute />} />)
  return children || <Outlet />;
};

export default ProtectedAdminRoute;

