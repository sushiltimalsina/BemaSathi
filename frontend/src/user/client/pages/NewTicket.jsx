import React, { useState } from "react";
import API from "../../../api/api";
import { useNavigate } from "react-router-dom";

const NewTicket = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    subject: "",
    category: "general",
    priority: "normal",
    message: "",
  });

  const [saving, setSaving] = useState(false);

  const update = (k, v) => setForm({ ...form, [k]: v });

  const submit = async () => {
    if (!form.subject.trim() || !form.message.trim()) {
      alert("Subject and message are required.");
      return;
    }

    setSaving(true);
    try {
      await API.post("/support/create", form);
      navigate("/client/support");
    } catch (err) {
      console.error(err);
      alert("Failed to create ticket.");
    }
    setSaving(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 space-y-6">
      <h1 className="text-xl font-bold">Create Support Ticket</h1>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-300 dark:border-slate-700 space-y-6">
        {/* Subject */}
        <div>
          <label className="text-sm font-medium">Subject</label>
          <input
            value={form.subject}
            onChange={(e) => update("subject", e.target.value)}
            className="w-full px-4 py-2 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-sm font-medium">Category</label>
          <select
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
            className="w-full px-4 py-2 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
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
            className="w-full px-4 py-2 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
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
            className="w-full px-4 py-3 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
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
    </div>
  );
};

export default NewTicket;
