import React, { useEffect, useState } from "react";
import API from "../../../api/api";

const Notifications = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await API.get("/notifications");
      const payload = res.data?.notifications ?? res.data ?? [];
      setItems(Array.isArray(payload) ? payload : []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark transition-colors">
      <div className="max-w-4xl mx-auto pt-10 pb-16 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-wide opacity-70">Inbox</p>
            <h1 className="text-2xl font-bold">Notifications</h1>
          </div>
          {loading && <span className="text-sm opacity-70">Loading...</span>}
        </div>

        {!loading && items.length === 0 ? (
          <p className="opacity-70">No notifications yet.</p>
        ) : (
          <div className="space-y-4">
            {items.map((n) => (
              <div
                key={n.id}
                className="
                  p-4 rounded-xl border border-border-light dark:border-border-dark 
                  bg-card-light dark:bg-card-dark shadow-sm 
                  hover:-translate-y-[1px] hover:shadow-md transition
                "
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{n.title}</p>
                    <p className="text-sm opacity-80">{n.message}</p>
                  </div>
                  {n.status && (
                    <span
                      className="
                        text-xs px-3 py-1 rounded-full
                        bg-hover-light dark:bg-hover-dark
                        border border-border-light dark:border-border-dark
                        capitalize
                      "
                    >
                      {n.status}
                    </span>
                  )}
                </div>
                <p className="text-xs mt-2 opacity-70">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
