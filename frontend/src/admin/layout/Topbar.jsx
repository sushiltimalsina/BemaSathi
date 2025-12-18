import React from "react";
import { BellIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";

const Topbar = () => {
  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    window.location.href = "/admin/login";
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold">Admin</h1>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <BellIcon className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

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

