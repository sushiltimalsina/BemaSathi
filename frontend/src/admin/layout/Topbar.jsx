import React, { useEffect, useRef, useState } from "react";
import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { Link, useNavigate } from "react-router-dom";
import API from "../utils/adminApi";
import { useAdminToast } from "../ui/AdminToast";

const Topbar = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const prevCountRef = useRef(0);
  const prevUnreadAtRef = useRef(null);
  const { addToast } = useAdminToast();
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [admin, setAdmin] = useState(() => {
    const raw = sessionStorage.getItem("admin_user");
    return raw ? JSON.parse(raw) : null;
  });

  const loadUnread = async () => {
    try {
      const res = await API.get("/admin/support/unread-count");
      const next = res.data?.count ?? 0;
      const latestUnreadAt = res.data?.latest_unread_at || null;
      const latestUnreadUser = res.data?.latest_unread_user || "a user";
      const latestUnreadMessage = res.data?.latest_unread_message || "";
      const prev = prevCountRef.current;
      const prevUnreadAt = prevUnreadAtRef.current;

      if (next > prev || (latestUnreadAt && latestUnreadAt !== prevUnreadAt)) {
        addToast({
          type: "info",
          title: `New message from ${latestUnreadUser}`,
          message: `${latestUnreadMessage || "New support message"} (${next} unread)`,
          duration: 3000,
        });
      }
      prevCountRef.current = next;
      prevUnreadAtRef.current = latestUnreadAt;
      setUnreadCount(next);
    } catch (e) {
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    loadUnread();
    const interval = setInterval(loadUnread, 10000);
    const handleRefresh = () => loadUnread();
    window.addEventListener("support:refresh", handleRefresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener("support:refresh", handleRefresh);
    };
  }, []);

  useEffect(() => {
    const onStorage = () => {
      const raw = sessionStorage.getItem("admin_user");
      setAdmin(raw ? JSON.parse(raw) : null);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("admin_token");
    sessionStorage.removeItem("admin_user");
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    window.location.href = "/admin/login";
  };

  const avatar = admin?.name ? admin.name.charAt(0).toUpperCase() : "A";

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
          aria-label="Toggle sidebar"
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
        <Link to="/admin/dashboard" className="text-xl font-bold text-primary-light dark:text-primary-dark">
          <h1 className="text-lg font-semibold">Admin</h1>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {/* Support */}
        <button
          onClick={() => navigate("/admin/support")}
          className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ChatBubbleLeftRightIcon className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow">
              {unreadCount}
            </span>
          )}
        </button>
        {/* Notifications */}
        {/* <button className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <BellIcon className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button> */}

        {/* Profile dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setProfileOpen((prev) => !prev)}
            className="
              w-9 h-9 rounded-full
              bg-card-light dark:bg-card-dark
              border border-border-light dark:border-border-dark
              text-text-light dark:text-text-dark
              flex items-center justify-center font-semibold
              hover:bg-hover-light dark:hover:bg-hover-dark transition
            "
            aria-label="Admin profile"
          >
            {avatar}
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg py-2">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/admin/profile");
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-2"
              >
                <UserCircleIcon className="w-4 h-4" />
                Profile
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-2 text-red-600 dark:text-red-300"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
