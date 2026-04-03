import React, { useEffect, useState } from "react";
import API from "../utils/adminApi";
import { EnvelopeIcon, TrashIcon, PhoneIcon } from "@heroicons/react/24/outline";

const GuestInquiryList = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get("/htt/inquiries");
      // Sort newest first
      const sorted = res.data.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setInquiries(sorted);
    } catch (err) {
      console.error(err);
      setError("Failed to load generic inquiries.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/htt/inquiries/${id}`);
      setInquiries((prev) => prev.filter((i) => i.id !== id));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete inquiry.");
    }
  };

  const markAsRead = async (id) => {
    try {
      await API.patch(`/htt/inquiries/${id}/read`);
      setInquiries((prev) => prev.map(i => i.id === id ? { ...i, is_read: true } : i));
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await API.patch("/htt/inquiries/mark-all-read");
      setInquiries((prev) => prev.map(i => ({ ...i, is_read: true })));
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const unreadCount = inquiries.filter(i => !i.is_read).length;

  if (loading) {
    return <div className="p-6 opacity-70">Loading inquiries...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500 font-medium">{error}</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          Guest Contact Messages
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2.5 py-1 rounded-full">{unreadCount} New</span>
          )}
        </h1>
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="text-sm px-4 py-2 bg-background-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-xl hover:bg-hover-light transition"
          >
            Mark All as Read
          </button>
        )}
      </div>

      <div className="bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-xl shadow-sm overflow-hidden">
        {inquiries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-background-light dark:bg-background-dark border-b border-border-light dark:border-border-dark opacity-80">
                <tr>
                  <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider">
                    Sender
                  </th>
                  <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider">
                    Policy (if any)
                  </th>
                  <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-border-dark">
                {inquiries.map((inquiry) => (
                  <tr
                    key={inquiry.id}
                    onClick={() => {
                      if (!inquiry.is_read) {
                        markAsRead(inquiry.id);
                      }
                    }}
                    className={`transition cursor-pointer ${!inquiry.is_read 
                      ? 'bg-red-500/5 dark:bg-red-500/10 font-medium' 
                      : 'hover:bg-background-light/50 dark:hover:bg-background-dark/50'}`}
                  >
                    {/* Date */}
                    <td className="px-5 py-3 whitespace-nowrap opacity-80 flex items-center gap-2">
                      {!inquiry.is_read && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse"></span>}
                      <div>
                        {new Date(inquiry.created_at).toLocaleDateString()}
                        <div className="text-xs opacity-70 font-normal">
                          {new Date(inquiry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </td>

                    {/* Sender Info */}
                    <td className="px-5 py-3 whitespace-nowrap">
                      <div className="font-semibold">{inquiry.name}</div>
                      <div className="text-xs opacity-70 flex items-center gap-1 mt-0.5">
                        <EnvelopeIcon className="w-3 h-3" /> {inquiry.email}
                      </div>
                      {inquiry.phone && (
                        <div className="text-xs opacity-70 mt-0.5 whitespace-nowrap">
                          📞 {inquiry.phone}
                        </div>
                      )}
                    </td>

                    {/* Message */}
                    <td className="px-5 py-3">
                      <p className="line-clamp-2 max-w-sm" title={inquiry.message}>
                        {inquiry.message}
                      </p>
                    </td>

                    {/* Policy (if linked) */}
                    <td className="px-5 py-3">
                      {inquiry.policy ? (
                        <div className="text-primary-light dark:text-primary-dark font-medium">
                          {inquiry.policy.policy_name}
                        </div>
                      ) : (
                        <span className="opacity-60 italic text-xs">General Question</span>
                      )}
                    </td>

                    {/* Action: Reply and Delete */}
                    <td className="px-5 py-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-3">
                        {!inquiry.is_read && (
                          <button
                            onClick={() => markAsRead(inquiry.id)}
                            className="px-2 py-1.5 rounded-lg border border-border-light dark:border-border-dark text-xs hover:bg-background-light dark:hover:bg-background-dark transition text-amber-600 dark:text-amber-400"
                            title="Mark as Read"
                          >
                            Mark Read
                          </button>
                        )}

                        {/* Mailto button for replying */}
                        <a
                          href={`mailto:${inquiry.email}?subject=BeemaSathi Support Reply`}
                          onClick={() => { if(!inquiry.is_read) markAsRead(inquiry.id); }}
                          className="px-3 py-1.5 rounded-lg border border-border-light dark:border-border-dark text-xs hover:bg-background-light dark:hover:bg-background-dark transition flex items-center gap-1"
                        >
                          <EnvelopeIcon className="w-4 h-4 inline mr-1 text-primary-light" />
                          Reply
                        </a>

                        {/* Tel button for calling */}
                        {inquiry.phone && (
                          <a
                            href={`tel:${inquiry.phone}`}
                            className="px-3 py-1.5 rounded-lg border border-border-light dark:border-border-dark text-xs hover:bg-background-light dark:hover:bg-background-dark transition flex items-center gap-1 text-green-600 dark:text-green-500"
                            title={`Call ${inquiry.phone}`}
                          >
                            <PhoneIcon className="w-4 h-4 inline mr-1" />
                            Call
                          </a>
                        )}

                        {/* Delete Confirmation Logic */}
                        {deleteConfirmId === inquiry.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-red-500 font-semibold">
                              Confirm?
                            </span>
                            <button
                              onClick={() => handleDelete(inquiry.id)}
                              className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(inquiry.id)}
                            className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition"
                            title="Delete"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center opacity-70">
            No guest messages found.
          </div>
        )}
      </div>
    </div>
  );
};

export default GuestInquiryList;
