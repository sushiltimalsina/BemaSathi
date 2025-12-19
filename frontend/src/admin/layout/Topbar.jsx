import React, { useEffect, useRef, useState } from "react";
import { BellIcon, ArrowRightOnRectangleIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import API from "../utils/adminApi";
import { useAdminToast } from "../ui/AdminToast";

const Topbar = () => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const prevCountRef = useRef(0);
  const prevUnreadAtRef = useRef(null);
  const { addToast } = useAdminToast();

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

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    window.location.href = "/admin/login";
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold">Admin</h1>

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

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          Logout
        </button>
      </div>
    </header>
  );
};

export default Topbar;
