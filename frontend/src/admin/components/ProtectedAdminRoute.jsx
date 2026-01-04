import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { broadcastLogout } from "../../utils/authBroadcast";

const ProtectedAdminRoute = ({ children }) => {
  const hasToken = !!sessionStorage.getItem("admin_token");
  const [ready, setReady] = useState(!!window.__authSyncReady);

  useEffect(() => {
    const onReady = () => setReady(true);
    window.addEventListener("auth-sync-ready", onReady);
    return () => window.removeEventListener("auth-sync-ready", onReady);
  }, []);

  if (!ready) {
    return null;
  }

  if (!hasToken) {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    sessionStorage.removeItem("admin_token");
    sessionStorage.removeItem("admin_user");
    broadcastLogout("admin");
    return <Navigate to="/admin/login" replace />;
  }

  // Support both wrapper usage (<ProtectedAdminRoute><Layout/></ProtectedAdminRoute>)
  // and route element usage (<Route element={<ProtectedAdminRoute />} />)
  return children || <Outlet />;
};

export default ProtectedAdminRoute;
