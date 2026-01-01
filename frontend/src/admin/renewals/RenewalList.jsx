import React, { useEffect, useMemo, useState } from "react";
import API from "../utils/adminApi";
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import { useAdminToast } from "../ui/AdminToast";
import { useAdminConfirm } from "../ui/AdminConfirm";

const RenewalList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [sendingId, setSendingId] = useState(null);
  const { addToast } = useAdminToast();
  const confirm = useAdminConfirm();

  useEffect(() => {
    const load = async () => {
      try {
        // Expected admin endpoint (adjust if your route differs)
        const res = await API.get("/admin/renewals");
        setItems(res.data || []);
      } catch (e) {
        console.error(e);
        setError("Unable to load renewals.");
      }
      setLoading(false);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((r) => {
      const matchStatus = status === "all" || r.renewal_status === status;

      const q = search.toLowerCase();
      const matchSearch =
        r.policy?.policy_name?.toLowerCase().includes(q) ||
        r.user?.name?.toLowerCase().includes(q) ||
        r.user?.email?.toLowerCase().includes(q);

      return matchStatus && matchSearch;
    });
  }, [items, status, search]);

  const badge = (s) => {
    switch (s) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-semibold">
            <CheckCircleIcon className="w-4 h-4" /> ACTIVE
          </span>
        );
      case "due":
        return (
          <span className="inline-flex items-center gap-1 text-yellow-600 dark:text-yellow-400 text-xs font-semibold">
            <ExclamationTriangleIcon className="w-4 h-4" /> DUE
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 text-xs font-semibold">
            <XCircleIcon className="w-4 h-4" /> EXPIRED
          </span>
        );
      default:
        return null;
    }
  };

  const daysLeft = (date) => {
    if (!date) return "-";
    const today = new Date();
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const target = new Date(
      typeof date === "string" && date.length <= 10
        ? `${date}T00:00:00`
        : date
    );
    if (Number.isNaN(target.getTime())) return "-";
    const diff = (target - startOfToday) / (1000 * 60 * 60 * 24);
    return Math.ceil(diff);
  };

  const formatDate = (date) => {
    if (!date) return "-";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return date;
    return parsed.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  const sendReminder = async (renewal) => {
    const remaining = daysLeft(renewal.next_renewal_date);
    if (remaining === "-" || remaining > 5) return;

    const ok = await confirm("Send a renewal reminder to the user?", {
      title: "Send Reminder",
      confirmText: "Send",
    });
    if (!ok) return;

    setSendingId(renewal.id);
    try {
      await API.post(`/admin/renewals/${renewal.id}/notify`);
      addToast({ type: "success", title: "Sent", message: "Renewal reminder sent." });
    } catch (e) {
      addToast({ type: "error", title: "Send failed", message: "Failed to send reminder." });
    }
    setSendingId(null);
  };

  if (loading)
    return <div className="opacity-70">Loading renewals...</div>;

  if (error)
    return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">Renewals</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage policy renewals
        </p>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search policy or user"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="
            flex-1 px-4 py-2 rounded-lg border
            bg-white dark:bg-slate-900
            border-slate-200 dark:border-slate-800
            focus:outline-none
          "
        />

        <div className="flex items-center gap-2">
          <FunnelIcon className="w-5 h-5 opacity-70" />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="
              px-3 py-2 rounded-lg border
              bg-white dark:bg-slate-900
              border-slate-200 dark:border-slate-800
            "
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="due">Due</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 dark:bg-slate-800">
            <tr>
              <th className="px-4 py-3 text-left">Policy</th>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Cycle</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Next Renewal</th>
              <th className="px-4 py-3 text-left">Days Left</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((r) => (
              <tr
                key={r.id}
                className="border-t border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40"
              >
                <td className="px-4 py-3 font-medium">
                  {r.policy?.policy_name}
                </td>
                <td className="px-4 py-3">
                  <div>{r.user?.name}</div>
                  <div className="text-xs opacity-70">
                    {r.user?.email}
                  </div>
                </td>
                <td className="px-4 py-3 capitalize">
                  {r.billing_cycle?.replace("_", " ")}
                </td>
                <td className="px-4 py-3 font-semibold">
                  रु. {r.cycle_amount}
                </td>
                <td className="px-4 py-3">
                  {formatDate(r.next_renewal_date)}
                </td>
                <td
                  className={`px-4 py-3 font-semibold ${
                    daysLeft(r.next_renewal_date) <= 3
                      ? "text-red-500"
                      : ""
                  }`}
                >
                  {daysLeft(r.next_renewal_date)}
                </td>
                <td className="px-4 py-3">
                  {badge(r.renewal_status)}
                </td>
                <td className="px-4 py-3">
                  {daysLeft(r.next_renewal_date) !== "-" &&
                  daysLeft(r.next_renewal_date) <= 5 ? (
                    <button
                      type="button"
                      onClick={() => sendReminder(r)}
                      disabled={sendingId === r.id}
                      className="text-xs font-semibold px-3 py-1 rounded-lg bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:hover:bg-amber-500 disabled:opacity-60"
                    >
                      {sendingId === r.id ? "Sending..." : "Send Reminder"}
                    </button>
                  ) : (
                    <span className="text-xs opacity-60">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RenewalList;
