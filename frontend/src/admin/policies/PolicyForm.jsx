import React, { useEffect, useState } from "react";
import API from "../utils/adminApi";
import { useNavigate, useParams } from "react-router-dom";
import {
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

const PolicyForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    policy_name: "",
    company_name: "",
    insurance_type: "health",
    premium_amt: "",
    coverage_limit: "",
    policy_description: "",
    is_active: true,
  });

  useEffect(() => {
    if (isEdit) loadPolicy();
  }, [id]);

  const loadPolicy = async () => {
    try {
      const res = await API.get(`/admin/policies/${id}`);
      setForm(res.data || {});
    } catch (e) {
      setError("Unable to load policy.");
    }
    setLoading(false);
  };

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    setError("");

    try {
      if (isEdit) {
        await API.put(`/admin/policies/${id}`, form);
      } else {
        await API.post("/admin/policies", form);
      }
      navigate("/admin/policies");
    } catch (e) {
      console.error(e);
      setError("Failed to save policy.");
    }

    setSaving(false);
  };

  if (loading)
    return <div className="opacity-70">Loading policy...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {isEdit ? "Edit Policy" : "Create Policy"}
          </h1>
          <p className="text-sm opacity-60">
            {isEdit
              ? "Modify existing policy details."
              : "Add a new insurance policy."}
          </p>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="
            px-5 py-2 rounded-lg font-semibold text-white
            bg-primary-light hover:bg-primary-dark transition
            disabled:opacity-60
          "
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-200/20 border border-red-400 text-red-600">
          {error}
        </div>
      )}

      {/* FORM */}
      <div
        className="
          bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800
          p-6 rounded-xl shadow-sm space-y-6
        "
      >
        {/* NAME */}
        <Input
          label="Policy Name"
          value={form.policy_name}
          onChange={(e) => updateField("policy_name", e.target.value)}
        />

        {/* COMPANY */}
        <Input
          label="Company Name"
          value={form.company_name}
          onChange={(e) => updateField("company_name", e.target.value)}
        />

        {/* TYPE */}
        <Select
          label="Insurance Type"
          value={form.insurance_type}
          onChange={(e) => updateField("insurance_type", e.target.value)}
          options={[
            { label: "Health Insurance", value: "health" },
            { label: "Term Life Insurance", value: "term_life" },
            { label: "Whole Life Insurance", value: "whole_life" },
          ]}
        />

        {/* PREMIUM */}
        <Input
          label="Premium Amount (Yearly)"
          type="number"
          value={form.premium_amt}
          onChange={(e) => updateField("premium_amt", e.target.value)}
        />

        {/* COVERAGE */}
        <Input
          label="Coverage Limit"
          value={form.coverage_limit}
          onChange={(e) => updateField("coverage_limit", e.target.value)}
        />

        {/* DESCRIPTION */}
        <TextArea
          label="Policy Description"
          value={form.policy_description}
          onChange={(e) => updateField("policy_description", e.target.value)}
        />

        {/* ACTIVE TOGGLE */}
        <div className="flex items-center gap-3">
          <input
            id="active"
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => updateField("is_active", e.target.checked)}
            className="w-5 h-5"
          />
          <label htmlFor="active" className="text-sm font-medium">
            Policy is Active
          </label>
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
        bg-white dark:bg-slate-900
        border-slate-200 dark:border-slate-800
        focus:outline-none
      "
    />
  </div>
);

const Select = ({ label, options, ...props }) => (
  <div className="space-y-1">
    <label className="text-sm font-medium">{label}</label>
    <select
      {...props}
      className="
        w-full px-4 py-2 rounded-lg border
        bg-white dark:bg-slate-900
        border-slate-200 dark:border-slate-800
        focus:outline-none
      "
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

const TextArea = ({ label, ...props }) => (
  <div className="space-y-1">
    <label className="text-sm font-medium">{label}</label>
    <textarea
      {...props}
      rows="4"
      className="
        w-full px-4 py-2 rounded-lg border
        bg-white dark:bg-slate-900
        border-slate-200 dark:border-slate-800
        focus:outline-none
      "
    ></textarea>
  </div>
);

export default PolicyForm;
