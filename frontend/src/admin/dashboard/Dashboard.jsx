import React, { useEffect, useMemo, useState } from "react";
import Charts from "./Charts";
import {
  UsersIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import StatCard from "./StatCard";
import API from "../utils/adminApi";
import { useNavigate } from "react-router-dom";
import { useAdminToast } from "../ui/AdminToast";

const Dashboard = () => {
  const navigate = useNavigate();
  const { addToast } = useAdminToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await API.get("/admin/stats");
      setStats(res.data || null);
    } catch (e) {
      addToast({ type: "error", title: "Load failed", message: "Failed to load dashboard stats." });
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const formatNumber = (value) => {
    const num = Number(value || 0);
    return num.toLocaleString("en-IN");
  };

  const totalPayments = useMemo(() => {
    const val = stats?.totals?.totalPayments || 0;
    return formatNumber(val);
  }, [stats]);

  const cards = useMemo(() => {
    if (!stats?.totals) return [];
    return [
      {
        title: "Total Users",
        value: formatNumber(stats.totals.users || 0),
        icon: UsersIcon,
        subtitle: "Registered clients",
        onClick: () => navigate("/admin/users"),
      },
      {
        title: "Active Policies",
        value: formatNumber(stats.totals.activePolicies || 0),
        icon: ShieldCheckIcon,
        subtitle: "Currently active",
        onClick: () => navigate("/admin/policies"),
      },
      {
        title: "Renewals Due",
        value: formatNumber(stats.totals.renewalsDue || 0),
        icon: ArrowPathIcon,
        subtitle: "Next 7 days",
        onClick: () => navigate("/admin/renewals"),
      },
      {
        title: "Total Payments",
        value: totalPayments,
        icon: BanknotesIcon,
        subtitle: "Successful revenue",
        onClick: () => navigate("/admin/payments"),
      },
    ];
  }, [stats, navigate, totalPayments]);

  const recentPayments = stats?.recentPayments || [];
  const upcomingRenewals = stats?.upcomingRenewals || [];

  return (
    <div className="space-y-8">
      {/* PAGE TITLE */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Overview of system activity
        </p>
      </div>

      {/* STATS GRID */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {loading && <div className="opacity-70">Loading stats...</div>}
        {!loading &&
          cards.map((s, i) => (
            <StatCard key={i} {...s} />
          ))}
      </div>

      {/* PLACEHOLDER SECTIONS */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Payments</h2>
            <button
              type="button"
              onClick={() => navigate("/admin/payments")}
              className="text-xs font-semibold text-primary-light hover:underline"
            >
              View all
            </button>
          </div>
          {recentPayments.length ? (
            <div className="space-y-3">
              {recentPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="font-semibold">{p.user?.name || "User"}</div>
                    <div className="text-xs opacity-70">
                      {p.buy_request?.policy?.policy_name || "Policy"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatNumber(p.amount)}</div>
                    <div className="text-xs opacity-70">{p.status}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No recent payments yet.
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Upcoming Renewals</h2>
            <button
              type="button"
              onClick={() => navigate("/admin/renewals")}
              className="text-xs font-semibold text-primary-light hover:underline"
            >
              View all
            </button>
          </div>
          {upcomingRenewals.length ? (
            <div className="space-y-3">
              {upcomingRenewals.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="font-semibold">{r.user?.name || "User"}</div>
                    <div className="text-xs opacity-70">
                      {r.policy?.policy_name || "Policy"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {new Date(r.next_renewal_date).toLocaleDateString()}
                    </div>
                    <div className="text-xs opacity-70">{r.renewal_status}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No upcoming renewals.
            </p>
          )}
        </div>
      </div>

      <Charts
        monthlyPayments={stats?.monthlyPayments || []}
        monthlyUsers={stats?.monthlyUsers || []}
      />
    </div>
  );
};
export default Dashboard;
