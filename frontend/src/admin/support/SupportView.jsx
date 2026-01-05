import React, { useEffect, useRef, useState } from "react";
import API from "../utils/adminApi";
import { useParams } from "react-router-dom";
import {
  PaperAirplaneIcon,
  ChatBubbleOvalLeftIcon,
  ClockIcon,
  CheckIcon,
  ArrowLeftIcon,
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

  const isTabActive = () =>
    typeof document !== "undefined" &&
    document.visibilityState === "visible" &&
    document.hasFocus();

  const markSeenIfActive = async (data) => {
    const hasUnread = data?.messages?.some(
      (msg) => !msg.is_admin && msg.is_admin_seen === false
    );

    if (!hasUnread || !isTabActive()) return;

    try {
      await API.post(`/admin/support/${id}/mark-seen`);
      window.dispatchEvent(new Event("support:refresh"));
    } catch (e) {
      // ignore
    }
  };

  const load = async () => {
    try {
      const res = await API.get(`/admin/support/${id}`);
      setTicket(res.data);
      await markSeenIfActive(res.data);
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
    const handleVisibility = () => {
      if (!ticket) return;
      markSeenIfActive(ticket);
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, [ticket, id]);

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

  const displayName = ticket.user?.name || ticket.guest_name || "Guest";
  const displayEmail = ticket.user?.email || ticket.guest_email || "-";
  const displayPhone = ticket.guest_phone || "-";

  return (
    <div className="space-y-6 max-w-3xl">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">{ticket.subject}</h1>
        <p className="text-sm text-muted-light dark:text-muted-dark">
          From: {displayName} ({displayEmail})
        </p>
        {!ticket.user?.id && (
          <p className="text-xs text-muted-light dark:text-muted-dark">
            Guest phone: {displayPhone}
          </p>
        )}
      </div>

      {/* STATUS BUTTON */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="
            inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold
            border border-border-light dark:border-border-dark
            text-text-light dark:text-text-dark
            hover:bg-hover-light dark:hover:bg-hover-dark transition
          "
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={() => updateStatus("closed")}
          disabled={ticket.status === "closed"}
          className="px-3 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Close Ticket
        </button>
      </div>

      {/* CHAT */}
      <div
        ref={chatRef}
        className="bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark p-5 space-y-5 max-h-[60vh] overflow-y-auto"
      >

        {ticket.messages.map((m, i) => (
          <div
            key={i}
            className={`
              max-w-[80%] p-3 rounded-lg
              ${m.is_admin ? "ml-auto bg-primary-light text-white" : "bg-hover-light dark:bg-hover-dark"}
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
                  {m.is_user_seen && (
                    <CheckIcon className="-ml-1 w-3 h-3" />
                  )}
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
            bg-card-light dark:bg-card-dark border-border-light dark:border-border-dark
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
