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
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [toast, setToast] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [clearedAt, setClearedAt] = useState(() => {
    const raw = localStorage.getItem("client_notifications_cleared_at");
    const ts = raw ? Number(raw) : null;
    return Number.isFinite(ts) ? ts : null;
  });

  const unreadCount = useMemo(
    () => items.filter((n) => !isRead(n) && !isReminder(getId(n))).length,
    [items]
  );
  const realCount = useMemo(
    () => items.filter((n) => !isReminder(getId(n))).length,
    [items]
  );

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [notifRes, requestsRes] = await Promise.all([
        API.get("/notifications"),
        API.get("/my-requests"),
      ]);

      const notifData = notifRes.data?.data ?? notifRes.data ?? [];
      const reminders = buildRenewalReminders(requestsRes.data || []);

      const nextItems = [
        ...reminders,
        ...(Array.isArray(notifData) ? notifData : []),
      ];

      if (clearedAt) {
        const clearedDate = new Date(clearedAt);
        const filteredItems = nextItems.filter((n) => {
          const dt = getCreatedAt(n);
          if (!dt) return false;
          const d = new Date(dt);
          return Number.isNaN(d.getTime()) ? false : d > clearedDate;
        });
        setItems(filteredItems);
        emitUnread(filteredItems);
      } else {
        setItems(nextItems);
        emitUnread(nextItems);
      }
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

  useEffect(() => {
    setPage(1);
  }, [filter]);

  const showToast = (next) => {
    setToast(next);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), next?.duration ?? 2500);
  };

  const emitUnread = (list) => {
    const unread = list.filter((n) => !isRead(n)).length;
    window.dispatchEvent(
      new CustomEvent("notifications:update", { detail: { unreadCount: unread } })
    );
  };

  const markOneRead = async (id) => {
    // Synthetic reminder notifications are local-only
    if (isReminder(id)) {
      setItems((prev) => {
        const next = prev.map((n) =>
          getId(n) === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        );
        emitUnread(next);
        return next;
      });
      return;
    }

    setWorking(true);
    try {
      try {
        await API.put(`/notifications/${id}/read`);
      } catch (err) {
        // Fallback for backends that only accept POST
        await API.post(`/notifications/${id}/read`);
      }
      setItems((prev) => {
        const next = prev.map((n) =>
          getId(n) === id
            ? { ...n, read_at: n.read_at || new Date().toISOString(), is_read: true }
            : n
        );
        emitUnread(next);
        return next;
      });
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
      setItems((prev) => {
        const next = prev.map((n) => ({ ...n, read_at: n.read_at || now, is_read: true }));
        emitUnread(next);
        return next;
      });
    } catch (e) {
      console.error(e);
      setError("Failed to mark all notifications as read.");
    } finally {
      setWorking(false);
    }
  };

  const clearAll = async () => {
    setWorking(true);
    setError("");
    try {
      const now = Date.now();
      localStorage.setItem("client_notifications_cleared_at", String(now));
      setClearedAt(now);
      setItems([]);
      setPage(1);
      emitUnread([]);
      showToast({ type: "success", message: "All notifications cleared." });
    } catch (e) {
      console.error(e);
      setError("Failed to clear notifications.");
      showToast({ type: "error", message: "Failed to clear notifications." });
    } finally {
      setWorking(false);
    }
  };

  const filtered = useMemo(() => {
    if (filter === "unread") return items.filter((n) => !isRead(n));
    if (filter === "read") return items.filter((n) => isRead(n));
    return items;
  }, [items, filter]);

  const totalPages = useMemo(() => {
    const total = Math.ceil(filtered.length / pageSize);
    return total > 0 ? total : 1;
  }, [filtered.length, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  return (
    <div className="min-h-screen px-6 py-10 max-w-6xl mx-auto bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark">
      {toast && (
        <div className="fixed top-6 right-6 z-50">
          <div
            className={`
              px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold
              ${toast.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700"
                : "bg-rose-50 dark:bg-rose-900/40 text-rose-700 dark:text-rose-200 border-rose-200 dark:border-rose-700"}
            `}
          >
            {toast.message}
          </div>
        </div>
      )}
      {confirmOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark shadow-xl p-6">
            <h3 className="text-lg font-semibold">Clear all notifications?</h3>
            <p className="mt-2 text-sm text-muted-light dark:text-muted-dark">
              This action cannot be undone.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark hover:bg-hover-light dark:hover:bg-hover-dark transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmOpen(false);
                  clearAll();
                }}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition"
              >
                Clear all
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark">
            <BellIcon className="w-6 h-6 text-primary-light dark:text-primary-dark" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-sm text-muted-light dark:text-muted-dark">
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
              bg-card-light dark:bg-card-dark
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
              bg-card-light dark:bg-card-dark
              hover:bg-hover-light dark:hover:bg-hover-dark transition
              disabled:opacity-60 disabled:cursor-not-allowed
              inline-flex items-center gap-2
            "
          >
            <ArrowPathIcon className="w-4 h-4" />
            Refresh
          </button>

          {realCount > 1 && (
            <button
              onClick={markAllRead}
              disabled={working || unreadCount === 0}
              className="
                px-4 py-2 rounded-xl text-sm font-semibold text-white
                bg-gradient-to-r from-primary-light to-primary-dark
                hover:opacity-90 transition
                disabled:opacity-60 disabled:cursor-not-allowed
                inline-flex items-center gap-2
              "
            >
              <CheckCircleIcon className="w-4 h-4" />
              Mark all read
            </button>
          )}

          {realCount > 0 && (
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={working}
              className="
                px-4 py-2 rounded-xl text-sm font-semibold
                border border-border-light dark:border-border-dark
                text-text-light dark:text-text-dark
                bg-card-light dark:bg-card-dark
                hover:bg-hover-light dark:hover:bg-hover-dark transition
                disabled:opacity-60 disabled:cursor-not-allowed
              "
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* States */}
      {loading && (
        <div className="text-center text-muted-light dark:text-muted-dark mt-14">
          Loading notifications...
        </div>
      )}

      {!loading && error && (
        <div className="mb-5 p-4 rounded-xl border border-red-300/60 dark:border-red-700/50 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center text-muted-light dark:text-muted-dark mt-16">
          No notifications found.
        </div>
      )}

      {/* List */}
      <div className="grid gap-4">
        {paged.map((n) => {
          const id = getId(n);
          const read = isRead(n);
          const reminder = isReminder(id);
          const title = getTitle(n);
          const message = getMessage(n);
          const when = formatWhen(getCreatedAt(n));
          const meta = getMeta(n);

          return (
            <div
              key={id}
              className={`
                p-5 rounded-2xl border
                ${read
                  ? "bg-card-light dark:bg-card-dark border-border-light dark:border-border-dark"
                  : "bg-card-light dark:bg-card-dark border-primary-light/30 dark:border-primary-dark/30"}
                shadow-sm hover:shadow-lg transition
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
                      {reminder ? "REMINDER" : read ? "READ" : "UNREAD"}
                    </span>
                    <p className="text-xs text-muted-light dark:text-muted-dark">{when}</p>
                  </div>

                  <h3 className="mt-2 text-base font-bold">{title}</h3>
                  <p className="mt-1 text-sm text-muted-light dark:text-muted-dark leading-relaxed">{message}</p>

                  {/* Optional meta (buy_request_id etc.) */}
                  {meta && (
                    <div className="mt-3 text-xs text-muted-light dark:text-muted-dark">
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
                      bg-card-light dark:bg-card-dark
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

      {!loading && filtered.length > pageSize && (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="
              px-3 py-1.5 rounded-lg text-sm
              border border-border-light dark:border-border-dark
              bg-card-light dark:bg-card-dark
              hover:bg-hover-light dark:hover:bg-hover-dark transition
              disabled:opacity-60 disabled:cursor-not-allowed
            "
          >
            Prev
          </button>

          {Array.from({ length: totalPages }).map((_, idx) => {
            const pageNum = idx + 1;
            const active = pageNum === page;
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-semibold
                  border ${active ? "border-primary-light/40 dark:border-primary-dark/40" : "border-border-light dark:border-border-dark"}
                  ${active ? "bg-primary-light/10 dark:bg-primary-dark/20 text-primary-light dark:text-primary-dark" : "bg-card-light dark:bg-card-dark"}
                  hover:bg-hover-light dark:hover:bg-hover-dark transition
                `}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="
              px-3 py-1.5 rounded-lg text-sm
              border border-border-light dark:border-border-dark
              bg-card-light dark:bg-card-dark
              hover:bg-hover-light dark:hover:bg-hover-dark transition
              disabled:opacity-60 disabled:cursor-not-allowed
            "
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

/* ---------- Safe field helpers (handles different API shapes) ---------- */

function getId(n) {
  return n.id ?? n.notification_id ?? n.uuid ?? n._id;
}

function isRead(n) {
  // Only trust the explicit is_read flag; avoid accidental auto-read from other fields
  return n.is_read === true || n.is_read === 1 || n.is_read === "1";
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

function isReminder(id) {
  return String(id).startsWith("reminder-");
}

// Build renewal reminders for policies expiring within 5 days
function buildRenewalReminders(requests) {
  const now = new Date();
  const soon = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

  return (requests || [])
    .filter((r) => r.next_renewal_date)
    .map((r) => ({
      raw: r,
      date: new Date(r.next_renewal_date),
    }))
    .filter(({ date }) => !Number.isNaN(date) && date >= now && date <= soon)
    .map(({ raw, date }) => ({
      id: `reminder-${raw.id}`,
      title: "Renewal Reminder",
      message: `Your policy ${raw.policy?.policy_name || ""} renews on ${date.toLocaleDateString()}.`,
      created_at: raw.next_renewal_date,
      is_read: false,
      meta: {
        policy: raw.policy?.policy_name,
        company: raw.policy?.company_name,
        next_renewal_date: raw.next_renewal_date,
      },
    }));
}

export default Notifications;
