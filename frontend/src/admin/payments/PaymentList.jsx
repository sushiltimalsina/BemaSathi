import React, { useEffect, useMemo, useState } from "react";
import API from "../../../api/api";
import {
  BanknotesIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";

const PaymentList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");

  const fmt = (n) =>
    Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

  useEffect(() => {
    const load = async () => {
      try {
        // Expected admin endpoint
        const res = await API.get("/admin/payments");
        setItems(res.data || []);
      } catch (e) {
        console.error(e);
        setError("Unable to load payments.");
      }
      setLoading(false);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((p) => {
      const matchStatus = status === "all" || p.status === status;

      const q = search.toLowerCase();
      const matchSearch =
        p.transaction_id?.toLowerCase().includes(q) ||
        p.payment_method?.toLowerCase().includes(q) ||
        p.user?.name?.toLowerCase().includes(q) ||
        p.user?.email?.toLowerCase().includes(q) ||
        p.buy_request?.policy?.policy_name?.toLowerCase().includes(q);

      return matchStatus && matchSearch;
    });
  }, [items, status, search]);

  const statusBadge = (s) => {
    switch (s) {
      case "success":
        return (
          <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-semibold">
            <CheckCircleIcon className="w-4 h-4" /> SUCCESS
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 text-xs font-semibold">
            <XCircleIcon className="w-4 h-4" /> FAILED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-yellow-600 dark:text-yellow-400 text-xs font-semibold">
            <ClockIcon className="w-4 h-4" /> PENDING
          </span>
        );
    }
  };

  if (loading)
    return <div className="opacity-70">Loading payments...</div>;

  if (error)
    return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">Payments</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          All payment transactions
        </p>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search by user, policy, transaction ID"
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
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 dark:bg-slate-800">
            <tr>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Policy</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Method</th>
              <th className="px-4 py-3 text-left">Cycle</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Date</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((p) => (
              <tr
                key={p.id}
                className="border-t border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40"
              >
                <td className="px-4 py-3">
                  <div>{p.user?.name}</div>
                  <div className="text-xs opacity-70">
                    {p.user?.email}
                  </div>
                </td>

                <td className="px-4 py-3 font-medium">
                  {p.buy_request?.policy?.policy_name}
                </td>

                <td className="px-4 py-3 font-semibold">
                  Rs. {fmt(p.amount)}
                </td>

                <td className="px-4 py-3 capitalize flex items-center gap-1">
                  <BanknotesIcon className="w-4 h-4 opacity-70" />
                  {p.payment_method}
                </td>

                <td className="px-4 py-3 capitalize">
                  {p.buy_request?.billing_cycle?.replace("_", " ") || "-"}
                </td>

                <td className="px-4 py-3">
                  {statusBadge(p.status)}
                </td>

                <td className="px-4 py-3">
                  {new Date(p.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentList;
