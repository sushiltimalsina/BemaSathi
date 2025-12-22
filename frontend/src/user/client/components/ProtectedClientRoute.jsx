import React from "react";
import { Navigate } from "react-router-dom";

// Guard for client-only routes based on presence of client_token
const ProtectedClientRoute = ({ children }) => {
  const token = sessionStorage.getItem("client_token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedClientRoute;

