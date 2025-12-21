import React, { useEffect, useMemo, useState } from "react";
import API from "../../../api/api";
import RenewalCard from "../components/RenewalCard";

const MyPolicies = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const loadPolicies = async () => {
    try {
      const res = await API.get("/my-requests");
      setRequests(res.data || []);
    } catch (err) {
      console.log(err);
      setError("Unable to load your policies.");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPolicies();
  }, []);

  const stats = useMemo(() => {
    const totals = { total: requests.length, active: 0, due: 0, expired: 0 };
    requests.forEach((r) => {
      const s = (r.renewal_status || "").toLowerCase();
      if (s === "active") totals.active += 1;
      else if (s === "due") totals.due += 1;
      else if (s === "expired") totals.expired += 1;
    });
    return totals;
  }, [requests]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return requests.filter((r) => {
      const s = (r.renewal_status || "").toLowerCase();
      const statusMatch =
        status === "all" ||
        (status === "active" && s === "active") ||
        (status === "due" && s === "due") ||
        (status === "expired" && s === "expired");

      if (!q) return statusMatch;

      const policy = r.policy || {};
      const matchText =
        policy.policy_name?.toLowerCase().includes(q) ||
        policy.company_name?.toLowerCase().includes(q);

      return statusMatch && matchText;
    });
  }, [requests, query, status]);

  if (loading)
    return (
      <div className="text-center mt-14 text-text-light dark:text-text-dark">
        Loading your policies...
      </div>
    );

  if (error)
    return (
      <div className="text-center mt-14 text-red-500 dark:text-red-400">
        {error}
      </div>
    );

  if (requests.length === 0)
    return (
      <div className="text-center mt-14 text-text-light dark:text-text-dark">
        You have no purchased policies yet.
      </div>
    );

  return (
    <div
      className="
        min-h-screen px-6 py-10 max-w-6xl mx-auto
        text-text-light dark:text-text-dark
        bg-background-light dark:bg-background-dark
      "
    >
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">My Policies</h1>
            <p className="text-sm text-text-light/70 dark:text-text-dark/70">
              Track renewals and coverage in one place.
            </p>
          </div>
          <div className="text-xs text-text-light/70 dark:text-text-dark/70">
            Total: {stats.total} | Active: {stats.active} | Due: {stats.due} |
            Expired: {stats.expired}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by policy or company"
            className="
              flex-1 px-4 py-2 rounded-lg border
              bg-card-light dark:bg-card-dark
              border-border-light dark:border-border-dark
              text-text-light dark:text-text-dark placeholder:text-text-light/50 dark:placeholder:text-text-dark/50
              focus:outline-none
            "
          />
          <div className="flex items-center gap-2">
            {["all", "active", "due", "expired"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setStatus(item)}
                className={`
                  px-3 py-2 rounded-lg text-xs font-semibold uppercase
                  border transition
                  ${
                    status === item
                      ? "bg-primary-light/10 text-primary-light dark:text-primary-dark border-primary-light/30 dark:border-primary-dark/30"
                      : "border-border-light dark:border-border-dark text-text-light/80 dark:text-text-dark/80 hover:bg-hover-light dark:hover:bg-hover-dark"
                  }
                `}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center mt-10 text-sm text-text-light/70 dark:text-text-dark/70">
          No policies match your filters.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((req) => (
            <RenewalCard key={req.id} request={req} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyPolicies;
