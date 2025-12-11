import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import GuestNavbar from "./GuestNavbar";
import ClientNavbar from "./ClientNavbar";
import useIdleLogout from "../hooks/useIdleLogout";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { isDark, mode, cycleMode } = useTheme();

  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("client_token")
  );

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("client_token"));
  }, [location.pathname]);

  useEffect(() => {
    const handler = (event) => {
      if (event.key === "client_token") {
        setIsLoggedIn(!!event.newValue);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  if (location.pathname.startsWith("/admin")) return null;

  const handleLogout = () => {
    localStorage.removeItem("client_token");
    localStorage.removeItem("client_user");
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
