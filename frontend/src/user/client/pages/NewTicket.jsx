import React, { useMemo, useState } from "react";
import API from "../../../api/api";
import { useLocation, useNavigate } from "react-router-dom";

const NewTicket = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const query = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
  const initialSubject = query.get("subject") || "";
  const initialCategory = query.get("category") || "general";
  const initialPriority = query.get("priority") || "normal";

  const [form, setForm] = useState(() => ({
    subject: initialSubject,
    category: initialCategory,
    priority: initialPriority,
    message: "",
  }));
  const [popup, setPopup] = useState({ open: false, message: "" });

  const [saving, setSaving] = useState(false);

  const update = (k, v) => setForm({ ...form, [k]: v });

  const submit = async () => {
    if (!form.subject.trim() || !form.message.trim()) {
      setPopup({ open: true, message: "Subject and message are required." });
      return;
    }

    setSaving(true);
    try {
      await API.post("/support/create", form);
      navigate("/client/support");
    } catch (err) {
      console.error(err);
      setPopup({ open: true, message: "Failed to create ticket." });
    }
    setSaving(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 space-y-6 text-text-light dark:text-text-dark">
      <h1 className="text-xl font-bold">Create Support Ticket</h1>

      <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl border border-border-light dark:border-border-dark space-y-6">
        {/* Subject */}
        <div>
          <label className="text-sm font-medium">Subject</label>
          <input
            value={form.subject}
            onChange={(e) => update("subject", e.target.value)}
            className="w-full px-4 py-2 rounded-lg border bg-card-light dark:bg-card-dark border-border-light dark:border-border-dark"
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-sm font-medium">Category</label>
          <select
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
            className="w-full px-4 py-2 rounded-lg border bg-card-light dark:bg-card-dark border-border-light dark:border-border-dark"
          >
            <option value="general">General</option>
            <option value="kyc">KYC Issue</option>
            <option value="kyc_update">KYC Update Request</option>
            <option value="payment">Payment Issue</option>
            <option value="policy">Policy Issue</option>
            <option value="renewal">Renewal Issue</option>
            <option value="technical">Technical Problem</option>
          </select>
        </div>

        {/* Priority */}
        <div>
          <label className="text-sm font-medium">Priority</label>
          <select
            value={form.priority}
            onChange={(e) => update("priority", e.target.value)}
            className="w-full px-4 py-2 rounded-lg border bg-card-light dark:bg-card-dark border-border-light dark:border-border-dark"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </select>
        </div>

        {/* Message */}
        <div>
          <label className="text-sm font-medium">Describe Your Issue</label>
          <textarea
            value={form.message}
            onChange={(e) => update("message", e.target.value)}
            className="w-full px-4 py-3 rounded-lg border bg-card-light dark:bg-card-dark border-border-light dark:border-border-dark"
            rows={5}
          ></textarea>
        </div>

        {/* Submit */}
        <button
          onClick={submit}
          disabled={saving}
          className="px-5 py-2 rounded-lg bg-primary-light text-white font-semibold hover:bg-primary-dark"
        >
          {saving ? "Creating..." : "Create Ticket"}
        </button>
      </div>

      {popup.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-xl border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark p-5 shadow-xl text-text-light dark:text-text-dark">
            <div className="text-sm font-semibold mb-2">Notice</div>
            <div className="text-sm text-muted-light dark:text-muted-dark">{popup.message}</div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setPopup({ open: false, message: "" })}
                className="px-4 py-2 rounded-lg bg-primary-light text-white text-sm font-semibold hover:bg-primary-dark"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewTicket;
