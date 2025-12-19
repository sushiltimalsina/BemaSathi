import React, { useState } from "react";
import API from "../utils/adminApi";
import {
  DocumentArrowDownIcon,
  FunnelIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";

const Reports = () => {
  const [type, setType] = useState("users");
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const exportReport = async () => {
    setLoading(true);
    setMsg("");

    try {
      const res = await API.post(
        "/admin/reports/export",
        { type, status, from, to },
        { responseType: "blob" } // file download
      );

      const blob = new Blob([res.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `${type}-report.csv`;
      link.click();
      window.URL.revokeObjectURL(url);

      setMsg("Report downloaded successfully.");
    } catch (e) {
      console.error(e);
      setMsg("Failed to export report.");
    }

    setLoading(false);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Export and download system reports
        </p>
      </div>

      {/* FILTER PANEL */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        
        {/* ROW 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Report Type */}
          <div className="space-y-1">
            <label className="text-sm font-medium flex items-center gap-1">
              <FunnelIcon className="w-4 h-4" /> Report Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
            >
              <option value="users">Users Report</option>
              <option value="policies">Policies Report</option>
              <option value="payments">Payments Report</option>
              <option value="renewals">Renewals Report</option>
              <option value="kyc">KYC Report</option>
            </select>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="space-y-1">
            <label className="text-sm font-medium flex items-center gap-1">
              <CalendarDaysIcon className="w-4 h-4" /> Date Range
            </label>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
              />

              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
              />
            </div>
          </div>
        </div>

        {/* DOWNLOAD BUTTON */}
        <button
          onClick={exportReport}
          disabled={loading}
          className="
            w-full sm:w-auto flex items-center gap-2 px-5 py-3 rounded-lg
            bg-primary-light text-white hover:bg-primary-dark
            font-semibold transition disabled:opacity-60
          "
        >
          <DocumentArrowDownIcon className="w-5 h-5" />
          {loading ? "Exporting..." : "Download CSV Report"}
        </button>

        {/* MESSAGE */}
        {msg && (
          <div className="text-sm text-green-600 dark:text-green-400 mt-2">
            {msg}
          </div>
        )}
      </div>

      {/* INFO NOTE */}
      <p className="text-xs text-slate-500 dark:text-slate-400">
        CSV reports can be opened in Excel, Google Sheets, or any data tool.
      </p>
    </div>
  );
};

export default Reports;
