import React, { useEffect, useState, useMemo } from "react";
import API from "../utils/adminApi";
import {
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  EyeIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

const SupportList = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [category, setCategory] = useState("all");
  const normalizeCategory = (value) =>
    (value || "").toLowerCase().replace(/\s+/g, "_");
  const getTicketName = (ticket) =>
    ticket.user?.name || ticket.guest_name || "Guest";
  const getTicketEmail = (ticket) =>
    ticket.user?.email || ticket.guest_email || "-";

  const load = async () => {
    try {
      const res = await API.get("/admin/support");
      setTickets(res.data || []);
      window.dispatchEvent(new Event("support:refresh"));
    } catch (e) {
      console.error("Failed to load tickets");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      const q = search.toLowerCase();

      const matchSearch =
        t.subject.toLowerCase().includes(q) ||
        getTicketName(t).toLowerCase().includes(q) ||
        getTicketEmail(t).toLowerCase().includes(q);

      const matchStatus =
        status === "all" || t.status === status;

      const matchPriority =
        priority === "all" || t.priority === priority;

      const normalizedCategory = normalizeCategory(t.category);
      const matchCategory =
        category === "all" ||
        normalizedCategory === category ||
        normalizedCategory.startsWith(`${category}_`);

      return matchSearch && matchStatus && matchPriority && matchCategory;
    });
  }, [tickets, search, status, priority, category]);

  const kycUpdateTickets = useMemo(
    () => filtered.filter((t) => normalizeCategory(t.category) === "kyc_update"),
    [filtered]
  );

  const guestTickets = useMemo(
    () => filtered.filter((t) => normalizeCategory(t.category) === "guest_support"),
    [filtered]
  );

  const otherTickets = useMemo(
    () =>
      filtered.filter((t) => {
        const normalized = normalizeCategory(t.category);
        return normalized !== "kyc_update" && normalized !== "guest_support";
      }),
    [filtered]
  );

  if (loading) return <p className="opacity-70">Loading support tickets...</p>;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <h1 className="text-2xl font-bold">Support Tickets</h1>

      {/* FILTER BAR */}
      <div className="bg-card-light dark:bg-card-dark p-4 rounded-xl border border-border-light dark:border-border-dark flex flex-col sm:flex-row gap-4">

        {/* Search */}
        <input
          type="text"
          placeholder="Search by subject or user..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="
            flex-1 px-4 py-2 rounded-lg border
            bg-card-light dark:bg-card-dark border-border-light dark:border-border-dark
          "
        />

        {/* Status */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="
            px-3 py-2 rounded-lg border bg-card-light dark:bg-card-dark
            border-border-light dark:border-border-dark
          "
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>

        {/* Priority */}
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="
            px-3 py-2 rounded-lg border bg-card-light dark:bg-card-dark
            border-border-light dark:border-border-dark
          "
        >
          <option value="all">All Priority</option>
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
        </select>

        {/* Category */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="
            px-3 py-2 rounded-lg border bg-card-light dark:bg-card-dark
            border-border-light dark:border-border-dark
          "
        >
          <option value="all">All Category</option>
          <option value="general">General</option>
          <option value="guest_support">Guest Support</option>
          <option value="kyc">KYC Issue</option>
          <option value="kyc_update">KYC Update Request</option>
          <option value="payment">Payment Issue</option>
          <option value="policy">Policy Issue</option>
          <option value="renewal">Renewal Issue</option>
          <option value="technical">Technical Problem</option>
        </select>

      </div>

      {/* KYC UPDATE REQUESTS */}
      {kycUpdateTickets.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">KYC Update Requests</h2>
          <div className="overflow-x-auto border border-border-light dark:border-border-dark rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-hover-light dark:bg-hover-dark text-muted-light dark:text-muted-dark">
                <tr>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Subject</th>
                  <th className="px-4 py-3 text-left">Priority</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left"></th>
                  <th className="px-4 py-3 text-left"></th>
                </tr>
              </thead>

              <tbody>
                {kycUpdateTickets.map((t) => (
                  <tr
                    key={t.id}
                    className={`border-t border-border-light dark:border-border-dark hover:bg-hover-light dark:hover:bg-hover-dark ${
                      t.is_admin_seen === false
                        ? "bg-yellow-50/60 dark:bg-yellow-900/20"
                        : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{t.user?.name}</div>
                      <div className="text-xs opacity-70">{t.user?.email}</div>
                    </td>

                    <td className="px-4 py-3">{t.subject}</td>

                    <td className="px-4 py-3 capitalize">
                      {t.priority === "high" ? (
                        <span className="text-red-500 font-semibold">High</span>
                      ) : t.priority === "normal" ? (
                        "Normal"
                      ) : (
                        "Low"
                      )}
                    </td>

                    <td className="px-4 py-3 capitalize">
                      {t.status === "open" && <span className="text-blue-500 font-semibold">Open</span>}
                      {t.status === "in_progress" && <span className="text-yellow-500 font-semibold">In Progress</span>}
                      {t.status === "resolved" && <span className="text-green-500 font-semibold">Resolved</span>}
                      {t.status === "closed" && <span className="text-gray-500 font-semibold">Closed</span>}
                    </td>

                    <td className="px-4 py-3">
                      <button
                        onClick={async () => {
                          try {
                            await API.post(`/admin/support/${t.id}/mark-seen`);
                            window.dispatchEvent(new Event("support:refresh"));
                          } catch (e) {
                            // ignore
                          }
                          navigate(`/admin/support/${t.id}`);
                        }}
                        className="
                          flex items-center gap-2 px-3 py-1 rounded-lg text-xs border
                          border-border-light dark:border-border-dark
                          hover:bg-hover-light dark:hover:bg-hover-dark
                        "
                      >
                        <EyeIcon className="w-4 h-4" /> View
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          if (t.user?.id) {
                            navigate(`/admin/users?user=${t.user.id}`);
                          }
                        }}
                        className="
                          flex items-center gap-2 px-3 py-1 rounded-lg text-xs border
                          border-border-light dark:border-border-dark
                          hover:bg-hover-light dark:hover:bg-hover-dark
                        "
                        disabled={!t.user?.id}
                      >
                        User Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        </div>
      )}

      {/* GUEST SUPPORT */}
      {guestTickets.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Guest Support</h2>
          <div className="overflow-x-auto border border-border-light dark:border-border-dark rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-hover-light dark:bg-hover-dark text-muted-light dark:text-muted-dark">
                <tr>
                  <th className="px-4 py-3 text-left">Guest</th>
                  <th className="px-4 py-3 text-left">Subject</th>
                  <th className="px-4 py-3 text-left">Priority</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left"></th>
                </tr>
              </thead>

              <tbody>
                {guestTickets.map((t) => (
                  <tr
                    key={t.id}
                    className={`border-t border-border-light dark:border-border-dark hover:bg-hover-light dark:hover:bg-hover-dark ${
                      t.is_admin_seen === false
                        ? "bg-yellow-50/60 dark:bg-yellow-900/20"
                        : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{getTicketName(t)}</div>
                      <div className="text-xs opacity-70">{getTicketEmail(t)}</div>
                    </td>

                    <td className="px-4 py-3">{t.subject}</td>

                    <td className="px-4 py-3 capitalize">
                      {t.priority === "high" ? (
                        <span className="text-red-500 font-semibold">High</span>
                      ) : t.priority === "normal" ? (
                        "Normal"
                      ) : (
                        "Low"
                      )}
                    </td>

                    <td className="px-4 py-3 capitalize">
                      {t.status === "open" && <span className="text-blue-500 font-semibold">Open</span>}
                      {t.status === "in_progress" && <span className="text-yellow-500 font-semibold">In Progress</span>}
                      {t.status === "resolved" && <span className="text-green-500 font-semibold">Resolved</span>}
                      {t.status === "closed" && <span className="text-gray-500 font-semibold">Closed</span>}
                    </td>

                    <td className="px-4 py-3">
                      <button
                        onClick={async () => {
                          try {
                            await API.post(`/admin/support/${t.id}/mark-seen`);
                            window.dispatchEvent(new Event("support:refresh"));
                          } catch (e) {
                            // ignore
                          }
                          navigate(`/admin/support/${t.id}`);
                        }}
                        className="
                          flex items-center gap-2 px-3 py-1 rounded-lg text-xs border
                          border-border-light dark:border-border-dark
                          hover:bg-hover-light dark:hover:bg-hover-dark
                        "
                      >
                        <EyeIcon className="w-4 h-4" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="overflow-x-auto border border-border-light dark:border-border-dark rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-hover-light dark:bg-hover-dark text-muted-light dark:text-muted-dark">
            <tr>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Subject</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Priority</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left"></th>
            </tr>
          </thead>

          <tbody>
            {otherTickets.map((t) => (
              <tr
                key={t.id}
                className={`border-t border-border-light dark:border-border-dark hover:bg-hover-light dark:hover:bg-hover-dark ${
                  t.is_admin_seen === false
                    ? "bg-yellow-50/60 dark:bg-yellow-900/20"
                    : ""
                }`}
              >
                <td className="px-4 py-3">
                  <div className="font-medium">{getTicketName(t)}</div>
                  <div className="text-xs opacity-70">{getTicketEmail(t)}</div>
                </td>

                <td className="px-4 py-3">{t.subject}</td>

                <td className="px-4 py-3 capitalize">
                  {t.category || "-"}
                </td>

                <td className="px-4 py-3 capitalize">
                  {t.priority === "high" ? (
                    <span className="text-red-500 font-semibold">High</span>
                  ) : t.priority === "normal" ? (
                    "Normal"
                  ) : (
                    "Low"
                  )}
                </td>

                <td className="px-4 py-3 capitalize">
                  {t.status === "open" && <span className="text-blue-500 font-semibold">Open</span>}
                  {t.status === "in_progress" && <span className="text-yellow-500 font-semibold">In Progress</span>}
                  {t.status === "resolved" && <span className="text-green-500 font-semibold">Resolved</span>}
                  {t.status === "closed" && <span className="text-gray-500 font-semibold">Closed</span>}
                </td>

                <td className="px-4 py-3">
                  <button
                    onClick={async () => {
                      try {
                        await API.post(`/admin/support/${t.id}/mark-seen`);
                        window.dispatchEvent(new Event("support:refresh"));
                      } catch (e) {
                        // ignore
                      }
                      navigate(`/admin/support/${t.id}`);
                    }}
                    className="
                      flex items-center gap-2 px-3 py-1 rounded-lg text-xs border
                      border-border-light dark:border-border-dark
                      hover:bg-hover-light dark:hover:bg-hover-dark
                    "
                  >
                    <EyeIcon className="w-4 h-4" /> View
                  </button>
                </td>
              </tr>
            ))}

            {!otherTickets.length && (
              <tr>
                <td colSpan="6" className="text-center py-6 opacity-70">
                  No tickets found.
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>
    </div>
  );
};

export default SupportList;
