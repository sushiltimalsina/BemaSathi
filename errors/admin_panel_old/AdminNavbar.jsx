import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminAuthContext from "../context/AdminAuthContext";
import useIdleLogout from "../../hooks/useIdleLogout";
import { useTheme } from "../../context/ThemeContext";
import ThemeToggle from "../../components/ThemeDropdown";

const AdminNavbar = () => {
  const { admin, logout } = useContext(AdminAuthContext);
  const navigate = useNavigate();

  const { isDark, mode, cycleMode } = useTheme();

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  useIdleLogout({
    enabled: !!localStorage.getItem("admin_token"),
    onLogout: handleLogout,
    activityKey: "admin_last_activity",
    tokenKey: "admin_token",
    timeoutMs: 5 * 60 * 1000,
  });

  return (
    <nav
      className="
        bg-nav-light dark:bg-nav-dark
        text-text-light dark:text-text-dark
        border-b border-border-light dark:border-border-dark
        transition-colors duration-300
      "
    >
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center">

        {/* Brand */}
        <div 
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate("/admin/dashboard")}
        >
          <img
            src="/logo.png"
            alt="BemaSathi"
            className="w-9 h-9"
          />
          <div className="leading-tight">
            <span className="font-bold text-primary-light dark:text-primary-dark text-lg">
              BemaSathi
            </span>
            <div className="text-sm opacity-80">Admin</div>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-6 font-medium ml-auto">

          {/* Admin profile */}
          <button
            onClick={() => navigate("/admin/profile")}
            className="
              hover:text-primary-light dark:hover:text-primary-dark
              transition-all
            "
          >
            {admin?.name || "Admin"}
          </button>

          <ThemeToggle mode={mode} isDark={isDark} onToggle={cycleMode} />

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="
              px-4 py-1.5 rounded-md
              bg-red-600 text-white
              hover:bg-red-700
              transition
            "
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
