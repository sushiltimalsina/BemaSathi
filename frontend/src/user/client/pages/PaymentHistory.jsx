import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../../api/api";
import {
  BanknotesIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PrinterIcon,
  ShieldCheckIcon,
  UserIcon,
  DocumentTextIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

const PaymentHistory = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fmt = (n) =>
    Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

  const loadPayments = async () => {
    try {
      const res = await API.get("/my-payments");
      setPayments(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Unable to load payment history.");
    }
    setLoading(false);
  };

  const handleDownload = async (type, buyRequestId) => {
    if (!buyRequestId) return;
    const endpoint = type === 'policy' ? 'policy-document' : 'payment-receipt';
    try {
      const response = await API.get(`/buy-requests/${buyRequestId}/${endpoint}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_receipt.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed", err);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const statusBadge = (status, isVerified) => {
    const normalized = (status || "").toLowerCase();
    const isSuccess =
      normalized === "success" || normalized === "paid" || normalized === "completed";
    if (isVerified || isSuccess) {
      return (
        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
          <CheckCircleIcon className="w-4 h-4" /> Verified
        </span>
      );
    }

    if (normalized === "failed") {
      return (
        <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
          <XCircleIcon className="w-4 h-4" /> Failed
        </span>
      );
    }
    if (normalized === "cancelled") {
      return (
        <span className="flex items-center gap-1 text-slate-500 dark:text-slate-300">
          <XCircleIcon className="w-4 h-4" /> Cancelled
        </span>
      );
    }

    return (
      <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
        <ClockIcon className="w-4 h-4" /> Pending
      </span>
    );
  };

  if (loading)
    return (
      <p className="text-center mt-14 text-text-light dark:text-text-dark">
        Loading payment history...
      </p>
    );

  if (error)
    return (
      <p className="text-center mt-14 text-red-500 dark:text-red-400">
        {error}
      </p>
    );

  if (payments.length === 0)
    return (
      <p className="text-center mt-14 text-text-light dark:text-text-dark">
        No payment history found.
      </p>
    );

  return (
    <div className="min-h-screen px-6 py-10 max-w-6xl mx-auto bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark">
      <h1 className="text-3xl font-bold mb-8">Payment History</h1>

      <div className="overflow-x-auto rounded-xl border border-border-light dark:border-border-dark">
        <table className="w-full text-sm">
          <thead className="bg-hover-light dark:bg-hover-dark">
            <tr>
              <th className="px-4 py-3 text-left">Policy</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Method</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Cycle</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-right">Receipt</th>
            </tr>
          </thead>

          <tbody>
            {payments.map((p) => (
              <tr
                key={p.id}
                className="border-t border-border-light dark:border-border-dark hover:bg-hover-light/60 dark:hover:bg-hover-dark/60 transition"
              >
                <td className="px-4 py-3">
                  <div className="font-semibold">
                    {p.buy_request?.policy?.policy_name || p.policy?.policy_name || 'Policy Payment'}
                  </div>
                  <div className="text-xs opacity-70">
                    {p.buy_request?.policy?.company_name || p.policy?.company_name || 'Insurance Provider'}
                  </div>
                </td>

                <td className="px-4 py-3 font-semibold">
                  रु. {fmt(p.amount)}
                </td>

                <td className="px-4 py-3 capitalize">
                  <span className="flex items-center gap-1">
                    <BanknotesIcon className="w-4 h-4 opacity-70" />
                    {p.method || p.payment_method || "-"}
                  </span>
                </td>

                <td className="px-4 py-3 capitalize">
                   <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.payment_type === 'renewal' ? 'bg-amber-100 text-amber-700 dark:bg-amber-600/30 dark:text-amber-600' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-500'}`}>
                    {p.payment_type === 'renewal' ? 'Renewal' : 'New'}
                   </span>
                </td>

                <td className="px-4 py-3 capitalize">
                  {p.buy_request?.billing_cycle?.replace("_", " ") || "-"}
                </td>

                <td className="px-4 py-3">
                  {statusBadge(p.status, p.is_verified)}
                </td>

                <td className="px-4 py-3">
                  {new Date(p.created_at).toLocaleDateString()}
                </td>

                <td className="px-4 py-3 text-right">
                  {(p.is_verified || (p.status || "").toLowerCase() === "success") && p.buy_request_id ? (
                    <button
                      onClick={() => handleDownload("receipt", p.buy_request_id)}
                      className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition"
                      title="Download Receipt"
                    >
                      <PrinterIcon className="w-5 h-5 ml-auto" />
                    </button>
                  ) : (
                    // RETRY BUTTON FOR FAILED/PENDING
                    ((p.status || "").toLowerCase() === "failed" || (p.status || "").toLowerCase() === "pending") && (
                      <button
                        onClick={() => navigate(`/client/payment?payment=${p.hashed_id || p.id}`)}
                        className="px-3 py-1.5 rounded-lg bg-primary-light/10 text-primary-light dark:bg-primary-dark/20 dark:text-primary-dark hover:bg-primary-light hover:text-white dark:hover:bg-primary-dark transition text-xs font-bold flex items-center gap-1 ml-auto"
                        title="Retry Payment"
                      >
                        <ArrowPathIcon className="w-4 h-4" /> Retry
                      </button>
                    )
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

export default PaymentHistory;
