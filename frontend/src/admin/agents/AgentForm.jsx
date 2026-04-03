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
    company_id: "",
    is_active: true,
  });

  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);

  useEffect(() => {
    if (isEdit) loadAgent();
    loadCompanies();
  }, [id]);

  const loadCompanies = async () => {
    try {
      const res = await API.get("/htt/companies");
      setCompanies(res.data || []);
    } catch (e) {
      addToast({ type: "error", title: "Load failed", message: "Failed to load companies." });
    }
    setCompaniesLoading(false);
  };

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

      navigate("/htt/agents");
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
      <div className="bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-xl p-6 space-y-6">
        <Input label="Full Name" value={form.name} onChange={(e) => update("name", e.target.value)} />

        <Input label="Email" value={form.email} onChange={(e) => update("email", e.target.value)} />

        <Input label="Phone Number" value={form.phone} onChange={(e) => update("phone", e.target.value)} />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Associated Company</label>
            <button
              type="button"
              onClick={() => navigate("/htt/companies/create")}
              className="text-xs font-semibold text-primary-light hover:underline"
            >
              + Add Company
            </button>
          </div>
          <select
            value={form.company_id || ""}
            onChange={(e) => update("company_id", e.target.value)}
            disabled={companiesLoading}
            className="
              w-full px-4 py-2 rounded-lg border
              bg-card-light dark:bg-card-dark border-border-light dark:border-border-dark
              focus:outline-none focus:ring-2 focus:ring-primary-light
            "
          >
            <option value="">{companiesLoading ? "Loading..." : "Select Company"}</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

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
        bg-card-light dark:bg-card-dark border-border-light dark:border-border-dark
        focus:outline-none
      "
    />
  </div>
);

export default AgentForm;
