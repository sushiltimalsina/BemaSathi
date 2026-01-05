import React, { useEffect, useMemo, useState } from "react";
import API from "../utils/adminApi";
  import {
    BanknotesIcon,
    CheckCircleIcon,
    XCircleIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import { useAdminToast } from "../ui/AdminToast";
import { useAdminConfirm } from "../ui/AdminConfirm";

const PaymentList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const { addToast } = useAdminToast();
  const confirm = useAdminConfirm();

  const fmt = (n) =>
    Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

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

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((p) => {
      const normalizedStatus = (p.status || "").toLowerCase();
      const isSuccess =
        normalizedStatus === "success" ||
        normalizedStatus === "paid" ||
        normalizedStatus === "completed";

      const matchStatus =
        status === "all" ||
        (status === "success" && isSuccess) ||
        (status === "failed" && !isSuccess);

      const q = search.toLowerCase();
      const matchSearch =
        p.transaction_id?.toLowerCase().includes(q) ||
        p.payment_method?.toLowerCase().includes(q) ||
        p.payment_type?.toLowerCase().includes(q) ||
        p.user?.name?.toLowerCase().includes(q) ||
        p.user?.email?.toLowerCase().includes(q) ||
        p.buy_request?.policy?.policy_name?.toLowerCase().includes(q);

      return matchStatus && matchSearch;
    });
  }, [items, status, search]);

  const statusBadge = (payment) => {
    const normalizedStatus = (payment.status || "").toLowerCase();
    const isSuccess =
      normalizedStatus === "success" ||
      normalizedStatus === "paid" ||
      normalizedStatus === "completed";

    if (payment.is_verified) {
      return (
        <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-semibold">
          <CheckCircleIcon className="w-4 h-4" /> VERIFIED
        </span>
      );
    }

    if (isSuccess) {
      return (
        <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-semibold">
          <CheckCircleIcon className="w-4 h-4" /> SUCCESS
        </span>
      );
    }

    if (normalizedStatus === "cancelled") {
      return (
        <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-300 text-xs font-semibold">
          <XCircleIcon className="w-4 h-4" /> CANCELLED
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 text-xs font-semibold">
        <XCircleIcon className="w-4 h-4" /> FAILED
      </span>
    );
  };

  const verifyPayment = async (payment) => {
    const normalizedStatus = (payment.status || "").toLowerCase();
    const isSuccess =
      normalizedStatus === "success" ||
      normalizedStatus === "paid" ||
      normalizedStatus === "completed";

    if (payment.is_verified) return;

    const ok = await confirm(
      isSuccess
        ? "Verify this payment? This will notify the client."
        : "Payment failed. Send a repayment notice to the client?",
      {
        title: isSuccess ? "Verify Payment" : "Send Repayment Notice",
        confirmText: isSuccess ? "Verify" : "Send",
      }
    );
    if (!ok) return;

    try {
      await API.post(`/admin/payments/${payment.id}/verify`);
      load();
    } catch (e) {
      addToast({ type: "error", title: "Verify failed", message: "Failed to verify payment." });
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
            bg-card-light dark:bg-card-dark
            border-border-light dark:border-border-dark
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
              bg-card-light dark:bg-card-dark
              border-border-light dark:border-border-dark
            "
          >
            <option value="all">All</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-xl border border-border-light dark:border-border-dark">
        <table className="w-full text-sm">
          <thead className="bg-hover-light dark:bg-hover-dark text-muted-light dark:text-muted-dark">
            <tr>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Policy</th>
              <th className="px-4 py-3 text-left">Transaction ID</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Method</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Cycle</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((p) => (
              <tr
                key={p.id}
                className="border-t border-border-light dark:border-border-dark hover:bg-hover-light dark:hover:bg-hover-dark"
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

                <td className="px-4 py-3 font-mono text-xs">
                  {p.transaction_id || "-"}
                </td>

                <td className="px-4 py-3 font-semibold">
                  रु. {fmt(p.amount)}
                </td>

                <td className="px-4 py-3 capitalize flex items-center gap-1">
                  <BanknotesIcon className="w-4 h-4 opacity-70" />
                  {p.payment_method}
                </td>

                <td className="px-4 py-3 capitalize">
                  {p.payment_type ? (
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                        p.payment_type === "renewal"
                          ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                      }`}
                    >
                      {p.payment_type}
                    </span>
                  ) : (
                    "-"
                  )}
                </td>

                <td className="px-4 py-3 capitalize">
                  {p.buy_request?.billing_cycle?.replace("_", " ") || "-"}
                </td>

                <td className="px-4 py-3">
                  {statusBadge(p)}
                </td>

                <td className="px-4 py-3">
                  {new Date(p.created_at).toLocaleDateString()}
                </td>

                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => verifyPayment(p)}
                    disabled={p.is_verified || p.failed_notified}
                    className={`text-xs font-semibold px-3 py-1 rounded-lg transition ${
                      p.is_verified
                        ? "bg-hover-light text-muted-light dark:bg-hover-dark dark:text-muted-dark border border-border-light dark:border-border-dark cursor-not-allowed"
                        : p.failed_notified
                        ? "bg-hover-light text-muted-light dark:bg-hover-dark dark:text-muted-dark border border-border-light dark:border-border-dark cursor-not-allowed"
                        : (p.status || "").toLowerCase() === "success" ||
                          (p.status || "").toLowerCase() === "paid" ||
                          (p.status || "").toLowerCase() === "completed"
                        ? "bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                        : "bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:hover:bg-amber-500"
                    }`}
                  >
                    {p.is_verified
                      ? "Verified"
                      : p.failed_notified
                      ? "Notified"
                      : "Verify"}
                  </button>
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
