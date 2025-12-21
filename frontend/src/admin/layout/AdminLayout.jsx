import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { AdminToastProvider } from "../ui/AdminToast";
import { AdminConfirmProvider } from "../ui/AdminConfirm";
import useIdleLogout from "../../hooks/useIdleLogout";
import { useAdminAuth } from "../context/AdminAuthContext";

const AdminLayout = () => {
  const navigate = useNavigate();
  const { logout } = useAdminAuth();

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  useIdleLogout({
    enabled: !!sessionStorage.getItem("admin_token"),
    onLogout: handleLogout,
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
