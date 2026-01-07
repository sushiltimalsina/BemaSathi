import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bars3Icon, XMarkIcon, BellIcon } from "@heroicons/react/24/outline";
import ThemeToggle from "./ThemeDropdown";
import API from "../api/api";

const ClientNavbar = ({ isDark, mode, onToggleMode, onLogout }) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = () => {
      const sessionUser = sessionStorage.getItem("client_user");
      setUser(sessionUser ? JSON.parse(sessionUser) : null);
    };

    loadUser();
    const handler = () => loadUser();
    window.addEventListener("auth-sync", handler);

    return () => window.removeEventListener("auth-sync", handler);
  }, []);

  const avatar = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const closeMobile = () => setMobileOpen(false);
  const goNotifications = () => {
    closeMobile();
    navigate("/client/notifications");
  };

  const primaryLinks = [
    { to: "/client/dashboard", label: "Dashboard" },
    { to: "/client/policies", label: "All Policies" },
    { to: "/client/policies?compareHint=1", label: "Compare" },
  ];

  const accountLinks = [
    { to: "/client/profile", label: "My Profile" },
    { to: "/client/my-policies", label: "My Policies" },
    { to: "/client/saved", label: "Saved Policies" },
    { to: "/client/payments", label: "Payment History" },
  ];
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = sessionStorage.getItem("client_token");
        if (!token) {
          setUnreadCount(0);
          return;
        }

        const res = await API.get("/notifications");
        const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
        const clearedRaw = localStorage.getItem("client_notifications_cleared_at");
        const clearedAt = clearedRaw ? Number(clearedRaw) : null;
        const clearedDate = clearedAt && Number.isFinite(clearedAt) ? new Date(clearedAt) : null;
        const filtered = clearedDate
          ? list.filter((n) => {
              const dt = n.created_at || n.createdAt || n.time || n.date || null;
              if (!dt) return false;
              const d = new Date(dt);
              return Number.isNaN(d.getTime()) ? false : d > clearedDate;
            })
          : list;
        const unread = filtered.filter((n) => !n.is_read).length;
        setUnreadCount(unread);
      } catch (err) {
        console.log("Notification fetch error:", err);
        setUnreadCount(0);
      }
    };

    fetchNotifications();

    // Auto-refresh every 20 seconds
    const interval = setInterval(fetchNotifications, 20000);

    const onNotify = (e) => {
      const next = e?.detail?.unreadCount;
      if (typeof next === "number") {
        setUnreadCount(next);
        return;
      }
      fetchNotifications();
    };
    window.addEventListener("notifications:update", onNotify);

    return () => {
      clearInterval(interval);
      window.removeEventListener("notifications:update", onNotify);
    };
  }, []);


  return (
    <nav
      className="
        sticky top-0 z-50
        backdrop-blur-md
        border-b border-border-light dark:border-border-dark
        bg-nav-light/80 dark:bg-nav-dark/80
        text-text-light dark:text-text-dark
        transition
        client-navbar
      "
    >
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-4">

        {/* Logo */}
        <Link
          to="/"
          className="text-2xl font-bold text-primary-light dark:text-primary-dark flex items-center space-x-0.5"
        >      
          <span>BeemaSathi</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-6 font-medium ml-auto">

          {/* Primary Links */}
          {primaryLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="hover:text-primary-light dark:hover:text-primary-dark"
            >
              {item.label}
            </Link>
          ))}

          {/* Notifications Icon */}
          <button
            onClick={goNotifications}
            className="relative hover:text-primary-light dark:hover:text-primary-dark"
          >
            <BellIcon className="w-6 h-6" />

            {/* UNREAD BADGE */}
            {unreadCount > 0 && (
              <span
                className="
                  absolute -top-1.5 -right-1.5
                  w-5 h-5 rounded-full
                  flex items-center justify-center
                  text-xs font-bold
                  bg-red-600 text-white
                  dark:bg-red-500 dark:text-white
                  shadow
                "
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>


          {/* PROFILE DROPDOWN */}
          <div className="relative" ref={dropdownRef}>
                {/* OUTER CIRCLE */}
                <div
                  className="
                    w-12 h-12 rounded-full
                    bg-primary-light/25 dark:bg-primary-dark/25
                    flex items-center justify-center
                    border border-primary-light/40 dark:border-primary-dark/40
                  "
                >
                  {/* INNER CIRCLE (Avatar itself) */}
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="
                      w-10 h-10 rounded-full
                      bg-primary-light/20 dark:bg-primary-dark/30
                      flex items-center justify-center
                      font-bold text-primary-light dark:text-primary-dark
                      border border-primary-light/40 dark:border-primary-dark/40
                      hover:opacity-90 transition
                    "
                  >
                    {avatar}
                  </button>
                </div>


            {/* DROPDOWN */}
            {profileOpen && (
              <div
                className="
                  absolute right-0 mt-2 w-52
                  bg-card-light dark:bg-card-dark
                  rounded-xl shadow-lg border
                  border-border-light dark:border-border-dark
                  py-2 z-50
                "
              >
                {/* THEME TOGGLE inside dropdown */}
                <div className="px-4 py-2 border-b border-border-light dark:border-border-dark">
                  <ThemeToggle mode={mode} isDark={isDark} onToggle={onToggleMode} />
                </div>

                {/* Profile + other links */}
                {accountLinks.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="block px-4 py-2 hover:bg-hover-light dark:hover:bg-hover-dark"
                    onClick={() => setProfileOpen(false)}
                  >
                    {item.label}

                    
                  </Link>
                  
                ))}

                {/* Logout */}
                <button
                  onClick={() => {
                    onLogout();
                    setProfileOpen(false);
                  }}
                  className="
                    w-full text-left px-4 py-2 font-semibold
                    logout-btn
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50
                    transition
                  "
                >
                  Logout
                </button>

              </div>
            )}
          </div>
        </div>

        {/* MOBILE MENU BUTTON */}
        <div className="md:hidden ml-auto flex items-center gap-2">
          {/* Notification Icon */}
          <button
            onClick={goNotifications}
            className="
              relative p-2 rounded-lg border
              border-border-light dark:border-border-dark
              hover:bg-hover-light dark:hover:bg-hover-dark
            "
          >
            <BellIcon className="w-5 h-5" />
            {unreadCount > 0 && (
              <span
                className="
                  absolute -top-1.5 -right-1.5
                  w-5 h-5 rounded-full
                  flex items-center justify-center
                  text-xs font-bold
                  bg-red-600 text-white
                  dark:bg-red-500 dark:text-white
                  shadow
                "
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="
              p-2 rounded-lg border border-border-light dark:border-border-dark
              bg-card-light dark:bg-card-dark
            "
          >
            {mobileOpen ? (
              <XMarkIcon className="w-5 h-5" />
            ) : (
              <Bars3Icon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark">
          <div className="px-6 py-4 space-y-3">

            {/* Avatar */}
            <div className="flex items-center gap-3">
              <div
                className="
                  w-12 h-12 rounded-full 
                  bg-primary-light/20 dark:bg-primary-dark/20
                  border border-primary-light/40 dark:border-primary-dark/40
                  flex items-center justify-center
                  text-xl font-bold text-primary-light dark:text-primary-dark
                "
              >
                {avatar}
              </div>

              <div className="text-sm">
                <div className="font-semibold">{user?.name || "Guest"}</div>
                <div className="opacity-70">{user?.email}</div>
              </div>
            </div>

            {/* Primary Links */}
            <div className="pt-2 space-y-2">
              {primaryLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={closeMobile}
                  className="block py-2 text-sm hover:text-primary-light dark:hover:text-primary-dark"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Account Links */}
            <div className="pt-2 space-y-2 border-t border-border-light dark:border-border-dark">
              {accountLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={closeMobile}
                  className="block py-2 text-sm hover:text-primary-light dark:hover:text-primary-dark"
                >
                  {item.label}
                </Link>
              ))}

              {/* Theme Toggle */}
              <div className="pt-2">
                <ThemeToggle mode={mode} isDark={isDark} onToggle={onToggleMode} />
              </div>

              {/* Logout */}
              <button
                onClick={() => {
                  onLogout();
                  closeMobile();
                }}
                className="
                  w-full text-left px-4 py-2 font-semibold
                  logout-btn
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50
                  transition
                "
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default ClientNavbar;

