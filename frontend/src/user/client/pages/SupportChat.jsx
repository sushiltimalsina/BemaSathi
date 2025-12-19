import React, { useEffect, useState } from "react";
import API from "../../../api/api";
import { useParams } from "react-router-dom";
import { PaperAirplaneIcon, ClockIcon } from "@heroicons/react/24/outline";

const SupportChat = () => {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = async () => {
    try {
      const res = await API.get(`/support/${id}`);
      setTicket(res.data);
    } catch (e) {
      alert("Unable to load ticket.");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const sendReply = async () => {
    if (!message.trim() || ticket?.status === "closed") return;

    try {
      setSending(true);
      await API.post(`/support/${id}/reply`, { message });
      setMessage("");
      await load();
    } catch (e) {
      alert("Failed to send reply.");
    } finally {
      setSending(false);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto px-4 space-y-6">

      <div>
        <h1 className="text-xl font-bold">{ticket.subject}</h1>
        <p className="text-sm opacity-70">
          Status: {ticket.status.replace("_", " ")}
        </p>
      </div>

      {/* Chat Area */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 p-5 space-y-4 max-h-[65vh] overflow-y-auto">

        {ticket.messages.map((m, i) => (
          <div
            key={i}
            className={`
              max-w-[80%] p-3 rounded-lg
              ${m.is_admin ? "bg-slate-200 dark:bg-slate-800 ml-auto" : "bg-primary-light text-white"}
            `}
          >
            <p className="text-sm">{m.message}</p>
            <div className="text-[10px] opacity-70 mt-1 flex items-center gap-1">
              <ClockIcon className="w-3 h-3" />
              {new Date(m.created_at).toLocaleString()}
            </div>
          </div>
        ))}

      </div>

      {/* Reply Box */}
      <div className="flex items-center gap-2">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={ticket.status === "closed" || sending}
          className="flex-1 px-4 py-2 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
        />

        <button
          onClick={sendReply}
          disabled={ticket.status === "closed" || sending}
          className="px-4 py-2 rounded-lg bg-primary-light text-white hover:bg-primary-dark flex items-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <PaperAirplaneIcon className="w-5 h-5" /> Send
        </button>
      </div>

    </div>
  );
};

export default SupportChat;
