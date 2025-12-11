import React, { useEffect, useState } from "react";
import API from "../../../api/api";

const MyBuyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await API.get("/my-requests");

      setRequests(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark transition-colors">
      <div className="max-w-4xl mx-auto pt-10 pb-16 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-wide opacity-70">
              Activity
            </p>
            <h1 className="text-2xl font-bold">My Buy Requests</h1>
          </div>
          {loading && <span className="text-sm opacity-70">Loading...</span>}
        </div>

        {!loading && requests.length === 0 ? (
          <p className="opacity-70">
            You haven't submitted any buy requests yet.
          </p>
        ) : (
          <div className="space-y-4">
            {requests.map((r) => (
              <div
                key={r.id}
                className="
                  p-4 rounded-xl border border-border-light dark:border-border-dark 
                  bg-card-light dark:bg-card-dark shadow-sm 
                  hover:-translate-y-[1px] hover:shadow-md transition
                "
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{r.policy?.policy_name}</p>
                    <p className="text-sm opacity-70">
                      {r.policy?.company_name}
                    </p>
                  </div>
                  <span
                    className="
                      text-xs px-3 py-1 rounded-full
                      bg-hover-light dark:bg-hover-dark
                      border border-border-light dark:border-border-dark
                      capitalize
                    "
                  >
                    {r.status || "pending"}
                  </span>
                </div>

                <p className="text-xs opacity-70 mt-2">
                  Submitted on: {new Date(r.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBuyRequests;
