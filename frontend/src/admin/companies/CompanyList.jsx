import React, { useEffect, useMemo, useState } from "react";
import API from "../utils/adminApi";
import {
  BuildingOfficeIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { useAdminToast } from "../ui/AdminToast";

const CompanyList = () => {
  const navigate = useNavigate();
  const { addToast } = useAdminToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await API.get("/admin/companies");
      setItems(res.data || []);
    } catch (e) {
      console.error(e);
      setError("Unable to load companies.");
    }
    setLoading(false);
  };

  const filtered = useMemo(() => {
    return items.filter((c) => {
      const q = search.toLowerCase();

      const matchStatus =
        status === "all" ||
        (status === "active" && c.is_active) ||
        (status === "inactive" && !c.is_active);

      const matchSearch =
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q);

      return matchStatus && matchSearch;
    });
  }, [items, search, status]);

  const toggleStatus = async (company) => {
    try {
      await API.post(`/admin/companies/${company.id}/toggle`);
      load();
    } catch (e) {
      addToast({ type: "error", title: "Update failed", message: "Failed to update status." });
    }
  };

  if (loading)
    return <p className="opacity-70">Loading companies...</p>;

  if (error)
    return <p className="text-red-500">{error}</p>;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Companies</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage partner insurance companies
          </p>
        </div>

        <button
          onClick={() => navigate("/admin/companies/create")}
          className="
            inline-flex items-center gap-2 px-4 py-2 rounded-lg
            bg-primary-light text-white hover:bg-primary-dark transition
          "
        >
          <PlusIcon className="w-4 h-4" />
          Add Company
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search name, email, phone"
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
              <th className="px-4 py-3 text-left">Company</th>
              <th className="px-4 py-3 text-left">Contact</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((c) => (
              <tr
                key={c.id}
                className="border-t border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40"
              >
                <td className="px-4 py-3 font-medium flex items-center gap-2">
                  <BuildingOfficeIcon className="w-4 h-4 opacity-70" />
                  {c.name}
                </td>

                <td className="px-4 py-3">
                  <div>{c.email}</div>
                  <div className="text-xs opacity-70">{c.phone}</div>
                </td>

                <td className="px-4 py-3">
                  {c.is_active ? (
                    <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-300 text-xs font-semibold">
                      <CheckCircleIcon className="w-4 h-4" /> ACTIVE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-700 dark:text-red-300 text-xs font-semibold">
                      <XCircleIcon className="w-4 h-4" /> INACTIVE
                    </span>
                  )}
                </td>

                <td className="px-4 py-3 flex gap-2">
                  <button
                    onClick={() => navigate(`/admin/companies/${c.id}/edit`)}
                    className="
                      text-xs font-semibold px-3 py-1 rounded-lg
                      border border-slate-300 dark:border-slate-700
                      hover:bg-slate-100 dark:hover:bg-slate-800 transition
                    "
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => toggleStatus(c)}
                    className={`text-xs font-semibold px-3 py-1 rounded-lg transition ${
                      c.is_active
                        ? "bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                        : "bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                    }`}
                  >
                    {c.is_active ? "Disable" : "Enable"}
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

export default CompanyList;
