import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { broadcastLogout } from "../../../utils/authBroadcast";

// Guard for client-only routes based on presence of client_token
const ProtectedClientRoute = ({ children }) => {
  const token = sessionStorage.getItem("client_token");
  const [ready, setReady] = useState(!!window.__authSyncReady);

  useEffect(() => {
    const onReady = () => setReady(true);
    window.addEventListener("auth-sync-ready", onReady);
    return () => window.removeEventListener("auth-sync-ready", onReady);
  }, []);

  if (!ready) {
    return null;
  }

  if (!token) {
    localStorage.removeItem("client_token");
    localStorage.removeItem("client_user");
    broadcastLogout("client");
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedClientRoute;
