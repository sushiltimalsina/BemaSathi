import React from "react";
import Charts from "./Charts";
import {
  UsersIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import StatCard from "./StatCard";

const Dashboard = () => {
  // TEMP static values – will be replaced with API later
  const stats = [
    {
      title: "Total Users",
      value: "1,248",
      icon: UsersIcon,
      subtitle: "Registered clients",
    },
    {
      title: "Active Policies",
      value: "842",
      icon: ShieldCheckIcon,
      subtitle: "Currently active",
    },
    {
      title: "Renewals Due",
      value: "57",
      icon: ArrowPathIcon,
      subtitle: "Next 7 days",
      trend: 12,
    },
    {
      title: "Total Payments",
      value: "Rs. 2.3M",
      icon: BanknotesIcon,
      subtitle: "All-time revenue",
    },
  ];

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
        {stats.map((s, i) => (
          <StatCard key={i} {...s} />
        ))}
      </div>

      {/* PLACEHOLDER SECTIONS */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <h2 className="font-semibold mb-4">Recent Payments</h2>
          <p className="text-sm text-slate-500">
            (Will show latest payments here)
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <h2 className="font-semibold mb-4">Upcoming Renewals</h2>
          <p className="text-sm text-slate-500">
            (Will show renewals due soon)
          </p>
        </div>
      </div>
    </div>
  );
};
<Charts />


export default Dashboard;
