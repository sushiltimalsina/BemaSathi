import React, { useEffect, useState, useMemo } from "react";
import API from "../utils/adminApi";
import {
  UserCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { useAdminToast } from "../ui/AdminToast";

const AgentList = () => {
  const navigate = useNavigate();
  const { addToast } = useAdminToast();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const res = await API.get("/admin/agents");
      setAgents(res.data || []);
    } catch (e) {
      console.error(e);
      setError("Unable to load agents.");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return agents.filter((a) => {
      const q = search.toLowerCase();
      const matchSearch =
        a.name?.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q) ||
        a.phone?.toLowerCase().includes(q);

      const matchStatus =
        status === "all" ||
        (status === "active" && a.is_active) ||
        (status === "inactive" && !a.is_active);

      return matchSearch && matchStatus;
    });
  }, [agents, search, status]);

  const toggleStatus = async (agent) => {
    try {
      await API.post(`/admin/agents/${agent.id}/toggle`);
      load();
    } catch (e) {
      addToast({ type: "error", title: "Update failed", message: "Failed to update agent status." });
    }
  };

  if (loading) return <p className="opacity-70">Loading agents...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agents</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage insurance agents
          </p>
        </div>

        <button
          onClick={() => navigate("/admin/agents/create")}
          className="
            flex items-center gap-2 px-4 py-2 rounded-lg
            bg-primary-light text-white hover:bg-primary-dark transition
          "
        >
          <PlusIcon className="w-4 h-4" />
          Add Agent
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search agent..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="
            flex-1 px-4 py-2 rounded-lg border
            bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700
          "
        />

        <div className="flex items-center gap-2">
          <FunnelIcon className="w-5 h-5 opacity-70" />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="
              px-3 py-2 rounded-lg border
              bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700
            "
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-xl border border-slate-300 dark:border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 dark:bg-slate-800">
            <tr>
              <th className="px-4 py-3 text-left">Agent</th>
              <th className="px-4 py-3 text-left">Contact</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((a) => (
              <tr
                key={a.id}
                className="border-t border-slate-300 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40"
              >
                {/* AGENT NAME */}
                <td className="px-4 py-3 font-medium flex items-center gap-2">
                  <UserCircleIcon className="w-5 h-5 opacity-60" />
                  {a.name}
                </td>

                {/* CONTACT */}
                <td className="px-4 py-3">
                  <div>{a.email}</div>
                  <div className="text-xs opacity-70">{a.phone}</div>
                </td>

                {/* STATUS */}
                <td className="px-4 py-3">
                  {a.is_active ? (
                    <span className="text-xs text-green-600 dark:text-green-400 font-semibold flex items-center gap-1">
                      <CheckCircleIcon className="w-4 h-4" /> ACTIVE
                    </span>
                  ) : (
                    <span className="text-xs text-red-600 dark:text-red-400 font-semibold flex items-center gap-1">
                      <XCircleIcon className="w-4 h-4" /> INACTIVE
                    </span>
                  )}
                </td>

                {/* ACTIONS */}
                <td className="px-4 py-3 flex gap-2">
                  <button
                    onClick={() => navigate(`/admin/agents/${a.id}/edit`)}
                    className="
                      text-xs font-semibold px-3 py-1 rounded-lg border
                      border-slate-300 dark:border-slate-700
                      hover:bg-slate-100 dark:hover:bg-slate-800 transition
                    "
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleStatus(a)}
                    className={`text-xs font-semibold px-3 py-1 rounded-lg transition inline-flex items-center gap-1 cursor-pointer ${
                      a.is_active
                        ? "bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                        : "bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                    }`}
                  >
                    {a.is_active ? (
                      <>
                        <XCircleIcon className="w-4 h-4" />
                        Disable
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-4 h-4" />
                        Enable
                      </>
                    )}
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

export default AgentList;
