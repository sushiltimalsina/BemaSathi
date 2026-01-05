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
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const load = async () => {
    try {
      const res = await API.get("/admin/audit-logs");
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setLogs(data);

      // PICK IMPORTANT EVENTS FOR TIMELINE
      const critical = data.filter((log) =>
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
        (l.event || "").toLowerCase().includes(s) ||
        (l.description || "").toLowerCase().includes(s) ||
        (l.admin_name || "").toLowerCase().includes(s);

      const matchCat = category === "all" || l.category === category;

      return matchSearch && matchCat;
    });
  }, [logs, search, category]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [category, search]);

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
          <p className="text-sm text-muted-light dark:text-muted-dark">
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

        <div className="border-l border-border-light dark:border-border-dark pl-6 space-y-6">
          {important.map((item) => (
            <div key={item.id} className="relative">
              {/* Dot */}
              <span className="
                absolute -left-3 top-2 w-3 h-3 rounded-full
                bg-primary-light dark:bg-primary-dark
              "></span>

              <div className="bg-card-light dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{formatEvent(item.event)}</div>

                  <div className="text-xs opacity-70">
                    {new Date(item.created_at).toLocaleString()}
                  </div>
                </div>

                <p className="text-sm mt-1 opacity-80">{item.description}</p>

                <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                  <UserCircleIcon className="w-4 h-4" />
                  {item.admin_name || "System"}
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
      <div className="bg-card-light dark:bg-card-dark p-4 rounded-xl border border-border-light dark:border-border-dark flex flex-col sm:flex-row gap-4">
        
        {/* Search */}
        <div className="flex items-center px-3 py-2 border rounded-lg flex-1 bg-card-light dark:bg-card-dark border-border-light dark:border-border-dark">
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
              px-3 py-2 rounded-lg border bg-card-light dark:bg-card-dark
              border-border-light dark:border-border-dark
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
      <div className="overflow-x-auto border border-border-light dark:border-border-dark rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-hover-light dark:bg-hover-dark text-muted-light dark:text-muted-dark">
            <tr>
              <th className="px-4 py-3 text-left">Event</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-left">Admin</th>
              <th className="px-4 py-3 text-left">Date</th>
            </tr>
          </thead>

          <tbody>
            {paged.map((log) => (
              <tr
                key={log.id}
                className="border-t border-border-light dark:border-border-dark hover:bg-hover-light dark:hover:bg-hover-dark"
              >
                <td className="px-4 py-3 font-semibold">
                  {formatEvent(log.event)}
                </td>

                <td className="px-4 py-3">{log.description}</td>

                <td className="px-4 py-3 flex items-center gap-2">
                  <UserCircleIcon className="w-4 h-4 opacity-60" />
                  {log.admin_name || "System"}
                </td>

                <td className="px-4 py-3">
                  {new Date(log.created_at).toLocaleString()}
                </td>
              </tr>
            ))}

            {!paged.length && (
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

      <div className="flex items-center justify-between text-sm text-muted-light dark:text-muted-dark">
        <div>
          Page {page} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1 rounded-lg border border-border-light dark:border-border-dark disabled:opacity-50"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1 rounded-lg border border-border-light dark:border-border-dark disabled:opacity-50"
          >
            Next
          </button>
        </div>
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
