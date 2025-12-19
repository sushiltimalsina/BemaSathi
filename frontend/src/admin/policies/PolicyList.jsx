import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/adminApi";
import {
  ShieldCheckIcon,
  BuildingOfficeIcon,
  CurrencyRupeeIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

const PolicyList = () => {
  const navigate = useNavigate();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");

  const loadPolicies = async () => {
    try {
      const res = await API.get("/admin/policies");
      setPolicies(res.data || []);
    } catch (e) {
      console.error(e);
      setError("Unable to load policies.");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPolicies();
  }, []);

  const filtered = useMemo(() => {
    return policies.filter((p) => {
      const matchStatus =
        status === "all" ||
        (status === "active" && p.is_active) ||
        (status === "inactive" && !p.is_active);

      const q = search.toLowerCase();
      const matchSearch =
        p.policy_name?.toLowerCase().includes(q) ||
        p.company_name?.toLowerCase().includes(q) ||
        p.insurance_type?.toLowerCase().includes(q);

      return matchStatus && matchSearch;
    });
  }, [policies, status, search]);

  const toggleStatus = async (policy) => {
    try {
      await API.post(`/admin/policies/${policy.id}/toggle`);
      loadPolicies();
    } catch (e) {
      alert("Failed to update policy status.");
    }
  };

  if (loading) return <div className="opacity-70">Loading policies...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Policies</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage insurance policies
          </p>
        </div>

        <button
          className="
            inline-flex items-center gap-2 px-4 py-2 rounded-lg
            bg-primary-light text-white hover:opacity-90 transition
          "
          onClick={() => navigate("/admin/policies/create")}
        >
          <PlusIcon className="w-4 h-4" />
          Add Policy
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search policy / company / type"
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
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 dark:bg-slate-800">
            <tr>
              <th className="px-4 py-3 text-left">Policy</th>
              <th className="px-4 py-3 text-left">Company</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Base Premium</th>
              <th className="px-4 py-3 text-left">Coverage</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((p) => (
              <tr
                key={p.id}
                className="border-t border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40"
              >
                <td className="px-4 py-3 font-medium flex items-center gap-2">
                  <ShieldCheckIcon className="w-4 h-4 opacity-70" />
                  {p.policy_name}
                </td>

                <td className="px-4 py-3 flex items-center gap-2">
                  <BuildingOfficeIcon className="w-4 h-4 opacity-70" />
                  {p.company_name}
                </td>

                <td className="px-4 py-3 capitalize">
                  {p.insurance_type}
                </td>

                <td className="px-4 py-3 font-semibold flex items-center gap-1">
                  <CurrencyRupeeIcon className="w-4 h-4" />
                  {p.premium_amt}
                </td>

                <td className="px-4 py-3">
                  {p.coverage_limit}
                </td>

                <td className="px-4 py-3">
                  {p.is_active ? (
                    <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-semibold">
                      <CheckCircleIcon className="w-4 h-4" /> ACTIVE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 text-xs font-semibold">
                      <XCircleIcon className="w-4 h-4" /> INACTIVE
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 flex gap-2">
                  <button
                    onClick={() => navigate(`/admin/policies/${p.id}/edit`)}
                    className="text-xs font-semibold px-3 py-1 rounded-lg border border-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => toggleStatus(p)}
                    className="text-xs font-semibold px-3 py-1 rounded-lg border border-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    {p.is_active ? "Disable" : "Enable"}
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

export default PolicyList;
