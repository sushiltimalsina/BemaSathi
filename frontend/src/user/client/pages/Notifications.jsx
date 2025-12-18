import React, { useEffect, useMemo, useState } from "react";
import API from "../../../api/api";
import {
  BellIcon,
  CheckCircleIcon,
  EnvelopeOpenIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

const Notifications = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // all | unread | read

  const unreadCount = useMemo(
    () => items.filter((n) => !isRead(n)).length,
    [items]
  );

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get("/notifications");
      const data = res.data?.data ?? res.data ?? [];
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError("Unable to load notifications.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markOneRead = async (id) => {
    setWorking(true);
    try {
      try {
        await API.put(`/notifications/${id}/read`);
      } catch (err) {
        // Fallback for backends that only accept POST
        await API.post(`/notifications/${id}/read`);
      }
      setItems((prev) =>
        prev.map((n) => (getId(n) === id ? { ...n, read_at: n.read_at || new Date().toISOString(), is_read: true } : n))
      );
    } catch (e) {
      console.error(e);
      setError("Failed to mark notification as read.");
    } finally {
      setWorking(false);
    }
  };

  const markAllRead = async () => {
    setWorking(true);
    setError("");
    try {
      await API.post("/notifications/read-all");
      const now = new Date().toISOString();
      setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || now, is_read: true })));
    } catch (e) {
      console.error(e);
      setError("Failed to mark all notifications as read.");
    } finally {
      setWorking(false);
    }
  };

  const filtered = useMemo(() => {
    if (filter === "unread") return items.filter((n) => !isRead(n));
    if (filter === "read") return items.filter((n) => isRead(n));
    return items;
  }, [items, filter]);

  return (
    <div className="min-h-screen px-6 py-10 max-w-6xl mx-auto bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/60 dark:bg-black/30 border border-border-light dark:border-border-dark backdrop-blur">
            <BellIcon className="w-6 h-6 text-primary-light dark:text-primary-dark" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-sm opacity-70">
              Unread: <span className="font-semibold">{unreadCount}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="
              px-3 py-2 rounded-xl border text-sm
              bg-white/70 dark:bg-black/30 backdrop-blur
              border-border-light dark:border-border-dark
              focus:outline-none
            "
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>

          <button
            onClick={load}
            disabled={loading || working}
            className="
              px-4 py-2 rounded-xl text-sm font-semibold
              border border-border-light dark:border-border-dark
              bg-white/70 dark:bg-black/30 backdrop-blur
              hover:bg-hover-light dark:hover:bg-hover-dark transition
              disabled:opacity-60 disabled:cursor-not-allowed
              inline-flex items-center gap-2
            "
          >
            <ArrowPathIcon className="w-4 h-4" />
            Refresh
          </button>

          <button
            onClick={markAllRead}
            disabled={working || unreadCount === 0}
            className="
              px-4 py-2 rounded-xl text-sm font-semibold text-white
              bg-linear-to-r from-primary-light to-primary-dark
              hover:opacity-90 transition
              disabled:opacity-60 disabled:cursor-not-allowed
              inline-flex items-center gap-2
            "
          >
            <CheckCircleIcon className="w-4 h-4" />
            Mark all read
          </button>
        </div>
      </div>

      {/* States */}
      {loading && (
        <div className="text-center opacity-70 mt-14">Loading notifications...</div>
      )}

      {!loading && error && (
        <div className="mb-5 p-4 rounded-xl border border-red-300/60 dark:border-red-700/50 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center opacity-70 mt-16">
          No notifications found.
        </div>
      )}

      {/* List */}
      <div className="grid gap-4">
        {filtered.map((n) => {
          const id = getId(n);
          const read = isRead(n);
          const title = getTitle(n);
          const message = getMessage(n);
          const when = formatWhen(getCreatedAt(n));
          const meta = getMeta(n);

          return (
            <div
              key={id}
              className={`
                p-5 rounded-2xl border backdrop-blur
                ${read
                  ? "bg-white/50 dark:bg-black/25 border-border-light dark:border-border-dark"
                  : "bg-white/75 dark:bg-black/40 border-primary-light/30 dark:border-primary-dark/30"}
                shadow hover:shadow-lg transition
              `}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`
                        inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border
                        ${read
                          ? "bg-gray-500/10 text-gray-600 dark:text-gray-300 border-border-light dark:border-border-dark"
                          : "bg-primary-light/10 dark:bg-primary-dark/20 text-primary-light dark:text-primary-dark border-primary-light/30 dark:border-primary-dark/30"}
                      `}
                    >
                      {read ? "READ" : "UNREAD"}
                    </span>
                    <p className="text-xs opacity-70">{when}</p>
                  </div>

                  <h3 className="mt-2 text-base font-bold">{title}</h3>
                  <p className="mt-1 text-sm opacity-80 leading-relaxed">{message}</p>

                  {/* Optional meta (buy_request_id etc.) */}
                  {meta && (
                    <div className="mt-3 text-xs opacity-70">
                      {Object.entries(meta).slice(0, 3).map(([k, v]) => (
                        <span key={k} className="mr-3">
                          <span className="font-semibold">{k}:</span> {String(v)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {!read && (
                  <button
                    onClick={() => markOneRead(id)}
                    disabled={working}
                    className="
                      shrink-0 px-4 py-2 rounded-xl text-sm font-semibold
                      bg-white/70 dark:bg-black/30 backdrop-blur
                      border border-border-light dark:border-border-dark
                      hover:bg-hover-light dark:hover:bg-hover-dark transition
                      disabled:opacity-60 disabled:cursor-not-allowed
                      inline-flex items-center gap-2
                    "
                  >
                    <EnvelopeOpenIcon className="w-4 h-4" />
                    Mark read
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ---------- Safe field helpers (handles different API shapes) ---------- */

function getId(n) {
  return n.id ?? n.notification_id ?? n.uuid ?? n._id;
}

function isRead(n) {
  // support: read_at datetime OR boolean/numeric/string flags
  return (
    Boolean(n.read_at) ||
    n.is_read === true ||
    n.is_read === 1 ||
    n.is_read === "1" ||
    n.read === true ||
    n.read === 1 ||
    n.read === "1"
  );
}

function getTitle(n) {
  return n.title ?? n.subject ?? n.heading ?? "Notification";
}

function getMessage(n) {
  return n.message ?? n.body ?? n.description ?? n.content ?? "";
}

function getCreatedAt(n) {
  return n.created_at ?? n.createdAt ?? n.time ?? n.date ?? null;
}

function getMeta(n) {
  return n.meta ?? n.data ?? n.payload ?? null;
}

function formatWhen(dt) {
  if (!dt) return "";
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

export default Notifications;
