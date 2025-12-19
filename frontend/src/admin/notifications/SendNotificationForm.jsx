import React, { useEffect, useState } from "react";
import API from "../utils/adminApi";
import { XMarkIcon } from "@heroicons/react/24/outline";

const SendNotificationForm = ({ onClose, onSent }) => {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);

  const [form, setForm] = useState({
    title: "",
    message: "",
    target: "all", // all | user | pending_kyc | due_renewals
    user_id: "",
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await API.get("/admin/users");
      setUsers(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const send = async () => {
    setSending(true);
    setError("");

    try {
      await API.post("/admin/notifications/send", form);
      onSent();
      onClose();
    } catch (e) {
      console.error(e);
      setError("Failed to send notification.");
    }

    setSending(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex justify-center items-center z-50">
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-lg border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Send Notification</h2>
          <button onClick={onClose}>
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-200/20 border border-red-400 text-red-700 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* TITLE */}
        <div className="mb-4">
          <label className="text-sm font-medium">Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) =>
              setForm((f) => ({ ...f, title: e.target.value }))
            }
            className="w-full mt-1 px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
          />
        </div>

        {/* MESSAGE */}
        <div className="mb-4">
          <label className="text-sm font-medium">Message</label>
          <textarea
            rows="4"
            value={form.message}
            onChange={(e) =>
              setForm((f) => ({ ...f, message: e.target.value }))
            }
            className="w-full mt-1 px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
          ></textarea>
        </div>

        {/* TARGET */}
        <div className="mb-4">
          <label className="text-sm font-medium">Send To</label>
          <select
            value={form.target}
            onChange={(e) =>
              setForm((f) => ({ ...f, target: e.target.value }))
            }
            className="w-full mt-1 px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
          >
            <option value="all">All Users</option>
            <option value="user">Specific User</option>
            <option value="pending_kyc">Users with Pending KYC</option>
            <option value="due_renewals">Users with Renewals Due</option>
          </select>
        </div>

        {/* USER DROPDOWN (only when target=user) */}
        {form.target === "user" && (
          <div className="mb-4">
            <label className="text-sm font-medium">Select User</label>
            <select
              value={form.user_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, user_id: e.target.value }))
              }
              className="w-full mt-1 px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
            >
              <option value="">-- Select --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ACTION BUTTON */}
        <button
          onClick={send}
          disabled={sending}
          className="w-full py-2 mt-3 rounded-lg text-white bg-primary-light hover:bg-primary-dark transition disabled:opacity-60"
        >
          {sending ? "Sending..." : "Send Notification"}
        </button>
      </div>
    </div>
  );
};

export default SendNotificationForm;
