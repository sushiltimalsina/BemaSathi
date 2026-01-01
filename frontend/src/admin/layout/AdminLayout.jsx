import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { AdminToastProvider } from "../ui/AdminToast";
import { AdminConfirmProvider } from "../ui/AdminConfirm";
import useIdleLogout from "../../hooks/useIdleLogout";

const AdminLayout = () => {
  const hasSession = !!sessionStorage.getItem("admin_token");

  useIdleLogout({
    enabled: hasSession,
    onLogout: () => {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
      sessionStorage.removeItem("admin_token");
      sessionStorage.removeItem("admin_user");
      window.location.href = "/admin/login";
    },
    activityKey: "admin_last_activity",
    tokenKey: "admin_token",
    timeoutMs: 5 * 60 * 1000,
  });

  return (
    <AdminToastProvider>
      <AdminConfirmProvider>
        <div className="min-h-screen flex bg-gray-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
          {/* Sidebar */}
          <Sidebar />

          {/* Main */}
          <div className="flex-1 flex flex-col">
            <Topbar />

            <main className="flex-1 p-6 overflow-y-auto">
              <Outlet />
            </main>
          </div>
        </div>
      </AdminConfirmProvider>
    </AdminToastProvider>
  );
};

export default AdminLayout;
