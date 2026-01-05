import React, { useEffect, useState } from "react";
import API from "../utils/adminApi";
import { useNavigate, useParams } from "react-router-dom";
import { useAdminToast } from "../ui/AdminToast";

const CompanyForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const isEdit = Boolean(id);
  const { addToast } = useAdminToast();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    is_active: true,
  });

  useEffect(() => {
    if (isEdit) loadCompany();
  }, [id]);

  const loadCompany = async () => {
    try {
      const res = await API.get(`/admin/companies/${id}`);
      setForm(res.data || {});
    } catch (e) {
      addToast({ type: "error", title: "Load failed", message: "Failed to load company." });
    }
    setLoading(false);
  };

  const update = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const save = async () => {
    setSaving(true);

    try {
      if (isEdit) {
        await API.put(`/admin/companies/${id}`, form);
      } else {
        await API.post("/admin/companies", form);
      }
      navigate("/admin/companies");
    } catch (e) {
      addToast({ type: "error", title: "Save failed", message: "Failed to save company." });
    }

    setSaving(false);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {isEdit ? "Edit Company" : "Add Company"}
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

      <div className="bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-xl p-6 space-y-6">
        <Input label="Company Name" value={form.name} onChange={(e) => update("name", e.target.value)} />
        <Input label="Email" value={form.email} onChange={(e) => update("email", e.target.value)} />
        <Input label="Phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
        <Input label="Address" value={form.address} onChange={(e) => update("address", e.target.value)} />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => update("is_active", e.target.checked)}
          />
          <label>Active Company</label>
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
        bg-card-light dark:bg-card-dark
        border-border-light dark:border-border-dark
        focus:outline-none
      "
    />
  </div>
);

export default CompanyForm;
