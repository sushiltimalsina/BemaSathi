import React, { useEffect, useRef, useState } from "react";
import API from "../utils/adminApi";
import { useParams } from "react-router-dom";
import {
  PaperAirplaneIcon,
  ChatBubbleOvalLeftIcon,
  ClockIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { useAdminToast } from "../ui/AdminToast";
import { useAdminConfirm } from "../ui/AdminConfirm";

const SupportView = () => {
  const { id } = useParams();

  const [ticket, setTicket] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { addToast } = useAdminToast();
  const confirm = useAdminConfirm();
  const chatRef = useRef(null);

  const load = async () => {
    try {
      const res = await API.get(`/admin/support/${id}`);
      setTicket(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!chatRef.current) return;
    chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [ticket?.messages?.length]);

  useEffect(() => {
    const markSeen = async () => {
      try {
        await API.post(`/admin/support/${id}/mark-seen`);
        window.dispatchEvent(new Event("support:refresh"));
      } catch (e) {
        // ignore
      }
    };
    markSeen();
  }, [id]);

  const sendReply = async () => {
    if (!message.trim() || ticket?.status === "closed") return;

    try {
      setSending(true);
      await API.post(`/admin/support/${id}/reply`, { message });
      setMessage("");
      await load();
    } catch (e) {
      addToast({ type: "error", title: "Reply failed", message: "Failed to reply." });
    } finally {
      setSending(false);
    }
  };

  const updateStatus = async (status) => {
    if (ticket?.status === "closed") return;
    if (status === "closed") {
      const confirmed = await confirm("Close this ticket?", {
        title: "Close Ticket",
        confirmText: "Close",
      });
      if (!confirmed) return;
    }
    try {
      await API.post(`/admin/support/${id}/status`, { status });
      load();
    } catch (e) {
      addToast({ type: "error", title: "Update failed", message: "Failed to update status." });
    }
  };

  if (loading) return <p className="opacity-70">Loading ticket...</p>;

  return (
    <div className="space-y-6 max-w-3xl">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">{ticket.subject}</h1>
        <p className="text-sm opacity-70">
          From: {ticket.user?.name} ({ticket.user?.email})
        </p>
      </div>

      {/* STATUS BUTTON */}
      <div className="flex gap-3">
        <button
          onClick={() => updateStatus("closed")}
          disabled={ticket.status === "closed"}
          className="px-3 py-1 rounded-lg bg-gray-600 text-white disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Close Ticket
        </button>
      </div>

      {/* CHAT */}
      <div
        ref={chatRef}
        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 p-5 space-y-5 max-h-[60vh] overflow-y-auto"
      >

        {ticket.messages.map((m, i) => (
          <div
            key={i}
            className={`
              max-w-[80%] p-3 rounded-lg
              ${m.is_admin ? "ml-auto bg-primary-light text-white" : "bg-slate-200 dark:bg-slate-800"}
            `}
          >
            <p className="text-sm">{m.message}</p>
            <div className="text-[10px] opacity-70 mt-1 flex items-center gap-1">
              <ClockIcon className="w-3 h-3" />
              {new Date(m.created_at).toLocaleString()}
              {m.is_admin && (
                <span
                  className={`ml-1 inline-flex items-center ${
                    m.is_user_seen ? "text-sky-300" : "text-white/70"
                  }`}
                >
                  <CheckIcon className="w-3 h-3" />
                  <CheckIcon className="-ml-1 w-3 h-3" />
                </span>
              )}
            </div>
          </div>
        ))}

      </div>

      {/* REPLY BOX */}
      <div className="flex items-center gap-2">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendReply();
            }
          }}
          placeholder="Type your reply..."
          disabled={ticket.status === "closed" || sending}
          className="
            flex-1 px-4 py-2 rounded-lg border
            bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700
            disabled:opacity-60 disabled:cursor-not-allowed
          "
        />

        <button
          onClick={sendReply}
          disabled={ticket.status === "closed" || sending}
          className="
            px-4 py-2 rounded-lg bg-primary-light text-white hover:bg-primary-dark
            flex items-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed
          "
        >
          <PaperAirplaneIcon className="w-5 h-5" /> Send
        </button>
      </div>

    </div>
  );
};

export default SupportView;
