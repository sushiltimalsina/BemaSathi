import React, { useEffect, useState, useMemo } from "react";
import API from "../utils/adminApi";
import {
  BellIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import SendNotificationForm from "./SendNotificationForm";

const NotificationCenter = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    try {
      const res = await API.get("/admin/notifications");
      setItems(res.data || []);
    } catch (e) {
      setError("Unable to load notifications.");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((n) => {
      const q = search.toLowerCase();

      const matchSearch =
        n.title?.toLowerCase().includes(q) ||
        n.message?.toLowerCase().includes(q) ||
        n.user?.name?.toLowerCase().includes(q) ||
        n.user?.email?.toLowerCase().includes(q);

      const type = n.type === "payment" ? "system" : n.type || "system";
      const matchCat =
        category === "all" ||
        (category === "system" && type === "system") ||
        (category === "manual" && type === "manual");

      return matchSearch && matchCat;
    });
  }, [items, search, category]);

  if (loading)
    return <p className="opacity-70">Loading notifications...</p>;

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notification Center</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage & send notifications
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="
            px-4 py-2 text-white font-semibold rounded-lg
            bg-primary-light hover:bg-primary-dark transition
          "
        >
          Send Notification
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex items-center px-3 py-2 rounded-lg border bg-card-light dark:bg-card-dark border-border-light dark:border-border-dark flex-1">
          <MagnifyingGlassIcon className="w-5 h-5 opacity-70 mr-2" />
          <input
            type="text"
            placeholder="Search title, message, user..."
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
            className="px-3 py-2 rounded-lg border bg-card-light dark:bg-card-dark border-border-light dark:border-border-dark"
          >
            <option value="all">All Notifications</option>
            <option value="system">System Generated</option>
            <option value="manual">Admin Sent</option>
          </select>
        </div>
      </div>

      {/* NOTIFICATIONS TABLE */}
      <div className="overflow-x-auto rounded-xl border border-border-light dark:border-border-dark">
        <table className="w-full text-sm">
          <thead className="bg-hover-light dark:bg-hover-dark text-muted-light dark:text-muted-dark">
            <tr>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Title</th>
              <th className="px-4 py-3 text-left">Message</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Date</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((n) => (
              <tr
                key={n.id}
                className="border-t border-border-light dark:border-border-dark hover:bg-hover-light dark:hover:bg-hover-dark"
              >
                <td className="px-4 py-3">
                  {n.user ? (
                    <div>
                      <div>{n.user.name}</div>
                      <div className="text-xs opacity-70">{n.user.email}</div>
                    </div>
                  ) : (
                    <span className="opacity-50">All Users</span>
                  )}
                </td>

                <td className="px-4 py-3 font-medium">{n.title}</td>

                <td className="px-4 py-3">{n.message}</td>

                <td className="px-4 py-3 capitalize">
                  {(n.type || "system") === "system" ||
                  (n.type || "system") === "payment" ? (
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                      SYSTEM
                    </span>
                  ) : (
                    <span className="text-xs text-green-600 dark:text-green-400 font-semibold">
                      MANUAL
                    </span>
                  )}
                </td>

                <td className="px-4 py-3">
                  {new Date(n.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SEND NOTIFICATION MODAL */}
      {showForm && (
        <SendNotificationForm
          onClose={() => setShowForm(false)}
          onSent={load}
        />
      )}
    </div>
  );
};

export default NotificationCenter;
