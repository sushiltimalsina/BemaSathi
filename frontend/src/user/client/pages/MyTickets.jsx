import React, { useEffect, useState } from "react";
import API from "../../../api/api";
import {
  ChatBubbleLeftRightIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
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

  if (loading) return <p>Loading tickets...</p>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4">
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
            className="p-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">{t.subject}</h2>

              <button
                onClick={() => navigate(`/client/support/${t.id}`)}
                className="flex items-center gap-2 px-3 py-1 rounded-lg text-sm border hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <EyeIcon className="w-4 h-4" />
                View
              </button>
            </div>

            <div className="mt-2 text-sm opacity-80">
              <strong>Status:</strong> {t.status.replace("_", " ")}
            </div>

            <div className="text-xs opacity-60 mt-1">
              {new Date(t.created_at).toLocaleString()}
            </div>
          </div>
        ))}

        {!tickets.length && (
          <p className="text-center opacity-60">No tickets found.</p>
        )}
      </div>
    </div>
  );
};

export default MyTickets;
