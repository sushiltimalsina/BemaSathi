import React, { useEffect, useMemo, useState } from "react";
import API from "../utils/adminApi";
import { EnvelopeIcon } from "@heroicons/react/24/outline";
import { useAdminToast } from "../ui/AdminToast";
import { useAdminConfirm } from "../ui/AdminConfirm";

const AgentInquiryList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const { addToast } = useAdminToast();
  const confirm = useAdminConfirm();

  const fmt = (n) =>
    Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

  const load = async () => {
    try {
      const res = await API.get("/admin/agent-inquiries");
      setItems(res.data || []);
    } catch (e) {
      console.error(e);
      setError("Unable to load agent inquiries.");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((i) => {
      return (
        i.user_name?.toLowerCase().includes(q) ||
        i.user_email?.toLowerCase().includes(q) ||
        i.policy_name?.toLowerCase().includes(q) ||
        i.company_name?.toLowerCase().includes(q) ||
        i.agent_name?.toLowerCase().includes(q) ||
        i.agent_email?.toLowerCase().includes(q)
      );
    });
  }, [items, search]);

  const notifyAgent = async (item) => {
    if (item.notified_at) return;

    const ok = await confirm("Notify agent about this inquiry?", {
      title: "Notify Agent",
      confirmText: "Notify",
    });
    if (!ok) return;

    try {
      await API.post(`/admin/agent-inquiries/${item.id}/notify`);
      load();
      addToast({ type: "success", title: "Agent notified" });
    } catch (e) {
      addToast({
        type: "error",
        title: "Notification failed",
        message: "Unable to send email to agent.",
      });
    }
  };

  if (loading) return <div className="opacity-70">Loading inquiries...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Agent Inquiries</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Logged agent detail views from policy pages
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search by user, policy, agent or company"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="
            flex-1 px-4 py-2 rounded-lg border
            bg-white dark:bg-slate-900
            border-slate-200 dark:border-slate-800
            focus:outline-none
          "
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 dark:bg-slate-800">
            <tr>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Policy</th>
              <th className="px-4 py-3 text-left">Company</th>
              <th className="px-4 py-3 text-left">Premium</th>
              <th className="px-4 py-3 text-left">Coverage</th>
              <th className="px-4 py-3 text-left">Agent</th>
              <th className="px-4 py-3 text-left">Contact</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr
                key={i.id}
                className="border-t border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40"
              >
                <td className="px-4 py-3">
                  <div>{i.user_name || "-"}</div>
                  <div className="text-xs opacity-70">{i.user_email || "-"}</div>
                </td>
                <td className="px-4 py-3 font-medium">{i.policy_name || "-"}</td>
                <td className="px-4 py-3">{i.company_name || "-"}</td>
                <td className="px-4 py-3">Rs. {fmt(i.premium_amount)}</td>
                <td className="px-4 py-3">{i.coverage_limit || "-"}</td>
                <td className="px-4 py-3">{i.agent_name || "-"}</td>
                <td className="px-4 py-3">
                  <div>{i.agent_phone || "-"}</div>
                  <div className="text-xs opacity-70">{i.agent_email || "-"}</div>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => notifyAgent(i)}
                    disabled={!!i.notified_at}
                    className={`text-xs font-semibold px-3 py-1 rounded-lg transition inline-flex items-center gap-1 ${
                      i.notified_at
                        ? "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                    }`}
                  >
                    <EnvelopeIcon className="w-4 h-4" />
                    {i.notified_at ? "Notified" : "Notify"}
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

export default AgentInquiryList;
