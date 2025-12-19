import React, { useEffect, useState } from "react";
import API from "../utils/adminApi";
import { useParams, useNavigate } from "react-router-dom";
import { useAdminToast } from "../ui/AdminToast";

const AgentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const { addToast } = useAdminToast();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    is_active: true,
  });

  useEffect(() => {
    if (isEdit) loadAgent();
  }, [id]);

  const loadAgent = async () => {
    try {
      const res = await API.get(`/admin/agents/${id}`);
      setForm(res.data || {});
    } catch (e) {
      addToast({ type: "error", title: "Load failed", message: "Failed to load agent." });
    }
    setLoading(false);
  };

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    setSaving(true);

    try {
      if (isEdit) {
        await API.put(`/admin/agents/${id}`, form);
      } else {
        await API.post("/admin/agents", form);
      }

      navigate("/admin/agents");
    } catch (e) {
      addToast({ type: "error", title: "Save failed", message: "Failed to save agent." });
    }

    setSaving(false);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {isEdit ? "Edit Agent" : "Add Agent"}
        </h1>

        <button
          onClick={save}
          disabled={saving}
          className="
            px-5 py-2 rounded-lg font-semibold text-white
            bg-primary-light hover:bg-primary-dark
            disabled:opacity-60
          "
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {/* FORM */}
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-6 space-y-6">
        <Input label="Full Name" value={form.name} onChange={(e) => update("name", e.target.value)} />

        <Input label="Email" value={form.email} onChange={(e) => update("email", e.target.value)} />

        <Input label="Phone Number" value={form.phone} onChange={(e) => update("phone", e.target.value)} />

        {!isEdit && (
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
          />
        )}

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => update("is_active", e.target.checked)}
          />
          <label>Active Agent</label>
        </div>
      </div>
    </div>
  );
};

const Input = ({ label, ...props }) => (
  <div className="space-y-1">
    <label className="text-sm font-medium">{label}</label>
    <input
      {...props}
      className="
        w-full px-4 py-2 rounded-lg border
        bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700
        focus:outline-none
      "
    />
  </div>
);

export default AgentForm;
