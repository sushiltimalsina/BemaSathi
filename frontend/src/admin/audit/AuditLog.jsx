import React, { useEffect, useState, useMemo } from "react";
import API from "../utils/adminApi";
import {
  ClockIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  DocumentArrowDownIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useAdminToast } from "../ui/AdminToast";

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [important, setImportant] = useState([]); // for timeline
  const [loading, setLoading] = useState(true);
  const { addToast } = useAdminToast();

  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");

  const load = async () => {
    try {
      const res = await API.get("/admin/audit-logs");
      setLogs(res.data || []);

      // PICK IMPORTANT EVENTS FOR TIMELINE
      const critical = res.data.filter((log) =>
        [
          "payment_verified",
          "kyc_approved",
          "kyc_rejected",
          "policy_updated",
          "settings_updated",
        ].includes(log.event)
      );

      setImportant(critical.slice(0, 8));
    } catch (e) {
      console.error("Failed to load audit logs");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      const s = search.toLowerCase();

      const matchSearch =
        l.event.toLowerCase().includes(s) ||
        l.description.toLowerCase().includes(s) ||
        l.admin_name.toLowerCase().includes(s);

      const matchCat = category === "all" || l.category === category;

      return matchSearch && matchCat;
    });
  }, [logs, search, category]);

  const exportCSV = async () => {
    try {
      const res = await API.get("/admin/audit-logs/export", {
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "audit_logs.csv";
      a.click();
    } catch (error) {
      addToast({ type: "error", title: "Export failed", message: "Failed to export logs." });
    }
  };

  if (loading)
    return <p className="opacity-70">Loading audit logs...</p>;

  return (
    <div className="space-y-10">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audit Log</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Track admin actions & important system events
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="
            flex items-center gap-2 px-4 py-2 rounded-lg
            bg-primary-light text-white hover:bg-primary-dark
          "
        >
          <DocumentArrowDownIcon className="w-5 h-5" />
          Export CSV
        </button>
      </div>

      {/* TIMELINE */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Recent Important Events</h2>

        <div className="border-l border-slate-300 dark:border-slate-700 pl-6 space-y-6">
          {important.map((item) => (
            <div key={item.id} className="relative">
              {/* Dot */}
              <span className="
                absolute -left-3 top-2 w-3 h-3 rounded-full
                bg-primary-light dark:bg-primary-dark
              "></span>

              <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{formatEvent(item.event)}</div>

                  <div className="text-xs opacity-70">
                    {new Date(item.created_at).toLocaleString()}
                  </div>
                </div>

                <p className="text-sm mt-1 opacity-80">{item.description}</p>

                <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                  <UserCircleIcon className="w-4 h-4" />
                  {item.admin_name}
                </div>
              </div>
            </div>
          ))}

          {!important.length && (
            <p className="opacity-60">No important events found.</p>
          )}
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-300 dark:border-slate-700 flex flex-col sm:flex-row gap-4">
        
        {/* Search */}
        <div className="flex items-center px-3 py-2 border rounded-lg flex-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          <MagnifyingGlassIcon className="w-5 h-5 opacity-70 mr-2" />
          <input
            type="text"
            placeholder="Search admin, event, description"
            className="w-full bg-transparent focus:outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Category */}
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-5 h-5 opacity-70" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="
              px-3 py-2 rounded-lg border bg-white dark:bg-slate-900
              border-slate-300 dark:border-slate-700
            "
          >
            <option value="all">All Categories</option>
            <option value="auth">Authentication</option>
            <option value="kyc">KYC</option>
            <option value="user">Users</option>
            <option value="agent">Agents</option>
            <option value="policy">Policies</option>
            <option value="payment">Payments</option>
            <option value="renewal">Renewals</option>
            <option value="settings">System Settings</option>
            <option value="notification">Notifications</option>
          </select>
        </div>
      </div>

      {/* TABLE LOG VIEW */}
      <div className="overflow-x-auto border border-slate-300 dark:border-slate-700 rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 dark:bg-slate-800">
            <tr>
              <th className="px-4 py-3 text-left">Event</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-left">Admin</th>
              <th className="px-4 py-3 text-left">Date</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((log) => (
              <tr
                key={log.id}
                className="border-t border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/40"
              >
                <td className="px-4 py-3 font-semibold">
                  {formatEvent(log.event)}
                </td>

                <td className="px-4 py-3">{log.description}</td>

                <td className="px-4 py-3 flex items-center gap-2">
                  <UserCircleIcon className="w-4 h-4 opacity-60" />
                  {log.admin_name}
                </td>

                <td className="px-4 py-3">
                  {new Date(log.created_at).toLocaleString()}
                </td>
              </tr>
            ))}

            {!filtered.length && (
              <tr>
                <td
                  colSpan="4"
                  className="text-center py-6 opacity-60 text-sm"
                >
                  No results found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

/* FORMAT EVENT NAME */
const formatEvent = (e) => {
  const map = {
    login: "Admin Logged In",
    logout: "Admin Logged Out",
    login_failed: "Failed Login Attempt",
    kyc_approved: "KYC Approved",
    kyc_rejected: "KYC Rejected",
    kyc_viewed: "KYC Viewed",
    user_created: "User Created",
    user_updated: "User Updated",
    user_disabled: "User Disabled",
    agent_created: "Agent Created",
    agent_updated: "Agent Updated",
    agent_disabled: "Agent Disabled",
    policy_created: "Policy Created",
    policy_updated: "Policy Updated",
    policy_disabled: "Policy Disabled",
    payment_verified: "Payment Verified",
    payment_failed: "Payment Failed",
    renewal_updated: "Renewal Updated",
    billing_cycle_updated: "Billing Cycle Updated",
    settings_updated: "System Settings Updated",
    notification_sent: "Notification Sent",
  };

  return map[e] || e;
};

export default AuditLog;
