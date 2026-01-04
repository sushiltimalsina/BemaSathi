import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import GuestNavbar from "./GuestNavbar";
import ClientNavbar from "./ClientNavbar";
import useIdleLogout from "../hooks/useIdleLogout";
import { broadcastLogout } from "../utils/authBroadcast";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { isDark, mode, cycleMode } = useTheme();

  const [isLoggedIn, setIsLoggedIn] = useState(
    !!sessionStorage.getItem("client_token")
  );

  useEffect(() => {
    setIsLoggedIn(!!sessionStorage.getItem("client_token"));
  }, [location.pathname]);

  useEffect(() => {
    const handler = () => {
      setIsLoggedIn(!!sessionStorage.getItem("client_token"));
    };
    window.addEventListener("auth-sync", handler);
    return () => window.removeEventListener("auth-sync", handler);
  }, []);

  if (location.pathname.startsWith("/admin")) return null;

  const handleLogout = () => {
    localStorage.removeItem("client_token");
    localStorage.removeItem("client_user");
    sessionStorage.removeItem("client_token");
    sessionStorage.removeItem("client_user");
    broadcastLogout("client");
    setIsLoggedIn(false);
    navigate("/");
  };

  useIdleLogout({
    enabled: isLoggedIn,
    onLogout: handleLogout,
    activityKey: "client_last_activity",
    tokenKey: "client_token",
    timeoutMs: 5 * 60 * 1000,
  });

  return isLoggedIn ? (
    <ClientNavbar
      isDark={isDark}
      mode={mode}
      onToggleMode={cycleMode}
      onLogout={handleLogout}
    />
  ) : (
    <GuestNavbar isDark={isDark} mode={mode} onToggleMode={cycleMode} />
  );
};

export default Navbar;
