import React, { useEffect, useState } from "react";
import API from "../../../api/api";
import { EyeIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

const MyTickets = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await API.get("/support/my-tickets");
      setTickets(res.data || []);
    } catch (err) {
      console.error(err);
      alert("Unable to load tickets.");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <p className="text-text-light dark:text-text-dark opacity-70">
        Loading tickets...
      </p>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 text-text-light dark:text-text-dark">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">My Support Tickets</h1>

        <button
          onClick={() => navigate("/client/support/new")}
          className="px-4 py-2 bg-primary-light text-white rounded-lg font-semibold hover:bg-primary-dark"
        >
          + New Ticket
        </button>
      </div>

      {/* Ticket Cards */}
      <div className="space-y-4">
        {tickets.map((t) => (
          <div
            key={t.id}
            className="p-4 rounded-xl border bg-card-light dark:bg-card-dark border-border-light dark:border-border-dark shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">{t.subject}</h2>

              <button
                onClick={() => navigate(`/client/support/${t.id}`)}
                className="flex items-center gap-2 px-3 py-1 rounded-lg text-sm border border-border-light dark:border-border-dark hover:bg-hover-light dark:hover:bg-hover-dark"
              >
                <EyeIcon className="w-4 h-4" />
                View
              </button>
            </div>

            <div className="mt-2 text-sm text-muted-light dark:text-muted-dark">
              <strong>Status:</strong> {t.status.replace("_", " ")}
            </div>

            <div className="text-xs text-muted-light dark:text-muted-dark mt-1">
              {new Date(t.created_at).toLocaleString()}
            </div>
          </div>
        ))}

        {!tickets.length && (
          <p className="text-center text-muted-light dark:text-muted-dark">
            No tickets found.
          </p>
        )}
      </div>
    </div>
  );
};

export default MyTickets;
