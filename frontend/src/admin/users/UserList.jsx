import React, { useEffect, useMemo, useState } from "react";
import API from "../utils/adminApi";
import {
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import UserDetails from "./UserDetails";
import { useLocation } from "react-router-dom";

const UserList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const location = useLocation();

  const load = async () => {
    try {
      const res = await API.get("/admin/users");
      setItems(res.data || []);
    } catch (e) {
      console.error(e);
      setError("Unable to load users.");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!items.length) return;
    const query = new URLSearchParams(location.search);
    const targetId = Number(query.get("user"));
    if (!targetId) return;
    const match = items.find((u) => u.id === targetId);
    if (match) {
      setSelectedUser(match);
    }
  }, [items, location.search]);

  const filtered = useMemo(() => {
    return items.filter((u) => {
      const matchStatus =
        status === "all" || u.kyc_status === status;

      const q = search.toLowerCase();
      const matchSearch =
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.toLowerCase().includes(q);

      return matchStatus && matchSearch;
    });
  }, [items, status, search]);

  const badge = (s) => {
    switch (s) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-semibold">
            <CheckCircleIcon className="w-4 h-4" /> APPROVED
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 text-yellow-600 dark:text-yellow-400 text-xs font-semibold">
            <ExclamationTriangleIcon className="w-4 h-4" /> PENDING
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 text-xs font-semibold">
            <XCircleIcon className="w-4 h-4" /> REJECTED
          </span>
        );
      default:
        return "-";
    }
  };

  if (loading)
    return <div className="opacity-70">Loading users...</div>;

  if (error)
    return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage clients & KYC
        </p>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search name, email or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 rounded-lg border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:outline-none"
        />

        <div className="flex items-center gap-2">
          <FunnelIcon className="w-5 h-5 opacity-70" />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          >
            <option value="all">All</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 dark:bg-slate-800">
            <tr>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-left">KYC</th>
              <th className="px-4 py-3 text-left">Joined</th>
              <th className="px-4 py-3 text-left"></th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((u) => (
              <tr
                key={u.id}
                className="border-t border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40"
              >
                <td className="px-4 py-3 font-medium">
                  <div>{u.name}</div>
                  <div className="text-xs opacity-70">{u.email}</div>
                </td>

                <td className="px-4 py-3">{u.phone}</td>
                <td className="px-4 py-3">{badge(u.kyc_status)}</td>
                <td className="px-4 py-3">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>

                <td className="px-4 py-3">
                  <button
                    onClick={() => setSelectedUser(u)}
                    className="
                      text-xs font-semibold px-3 py-1 rounded-lg
                      border border-slate-200 dark:border-slate-700
                      hover:bg-slate-100 dark:hover:bg-slate-800 transition
                    "
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SLIDE OVER */}
      {selectedUser && (
        <UserDetails user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </div>
  );
};

export default UserList;
