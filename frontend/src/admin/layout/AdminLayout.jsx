import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { AdminToastProvider } from "../ui/AdminToast";
import { AdminConfirmProvider } from "../ui/AdminConfirm";
import useIdleLogout from "../../hooks/useIdleLogout";
import { broadcastLogout } from "../../utils/authBroadcast";

const AdminLayout = () => {
  const hasSession = !!sessionStorage.getItem("admin_token");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useIdleLogout({
    enabled: hasSession,
    onLogout: () => {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
      sessionStorage.removeItem("admin_token");
      sessionStorage.removeItem("admin_user");
      broadcastLogout("admin");
      window.location.href = "/admin/login";
    },
    activityKey: "admin_last_activity",
    tokenKey: "admin_token",
    timeoutMs: 5 * 60 * 1000,
  });

  return (
    <AdminToastProvider>
      <AdminConfirmProvider>
        <div className="h-screen overflow-hidden bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark relative md:flex transition-colors">
          {/* Sidebar */}
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          {/* Main */}
          <div className="flex h-screen flex-col md:flex-1">
            <Topbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

            <main className="flex-1 min-h-0 p-4 sm:p-6 overflow-y-auto">
              <Outlet />
            </main>
          </div>
        </div>
      </AdminConfirmProvider>
    </AdminToastProvider>
  );
};

export default AdminLayout;
