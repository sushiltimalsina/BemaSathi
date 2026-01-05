import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const Charts = ({ monthlyPayments = [], monthlyUsers = [] }) => {
  const formatMonth = (value) => {
    if (!value) return "";
    const [year, month] = value.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleString("en-US", { month: "short" });
  };

  const revenueData = useMemo(() => {
    return monthlyPayments.map((item) => ({
      month: formatMonth(item.month),
      revenue: Number(item.total || 0),
    }));
  }, [monthlyPayments]);

  const usersData = useMemo(() => {
    return monthlyUsers.map((item) => ({
      month: formatMonth(item.month),
      users: Number(item.total || 0),
    }));
  }, [monthlyUsers]);

  return (
    <div className="grid lg:grid-cols-2 gap-6 mt-10">
      {/* REVENUE GRAPH */}
      <div className="bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-xl p-6 shadow-sm text-text-light dark:text-text-dark">
        <h2 className="font-semibold mb-4">Revenue (Last 6 Months)</h2>

        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" stroke="var(--muted)" />
            <YAxis stroke="var(--muted)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--panel)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                color: "var(--text)",
              }}
              labelStyle={{ color: "var(--muted)" }}
              itemStyle={{ color: "var(--text)" }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="var(--accent)"
              strokeWidth={3}
              dot={{ stroke: "var(--accent)", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* USER GROWTH GRAPH */}
      <div className="bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-xl p-6 shadow-sm text-text-light dark:text-text-dark">
        <h2 className="font-semibold mb-4">New Users (Last 6 Months)</h2>

        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={usersData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" stroke="var(--muted)" />
            <YAxis stroke="var(--muted)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--panel)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                color: "var(--text)",
              }}
              labelStyle={{ color: "var(--muted)" }}
              itemStyle={{ color: "var(--text)" }}
            />
            <Bar dataKey="users" fill="var(--success)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Charts;
