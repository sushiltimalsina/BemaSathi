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
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [policies, setPolicies] = useState([]);

  const [form, setForm] = useState({
    policy_name: "",
    company_name: "",
    insurance_type: "health",
    premium_amt: "",
    coverage_limit: "",
    policy_description: "",
    company_rating: "",
    waiting_period_days: "",
    copay_percent: "",
    claim_settlement_ratio: "",
    supports_smokers: false,
    covered_conditions: "",
    exclusions: "",
    is_active: true,
  });

  useEffect(() => {
    loadCompanies();
    loadPolicies();
    if (isEdit) loadPolicy();
  }, [id]);

  const loadCompanies = async () => {
    try {
      const res = await API.get("/admin/companies");
      setCompanies(res.data || []);
    } catch (e) {
      setError("Unable to load companies.");
    }
    setCompaniesLoading(false);
  };

  const loadPolicy = async () => {
    try {
      const res = await API.get(`/admin/policies/${id}`);
      const data = res.data || {};
      setForm({
        ...data,
        supports_smokers: Boolean(data.supports_smokers),
        is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
        covered_conditions: Array.isArray(data.covered_conditions)
          ? data.covered_conditions.join(", ")
          : data.covered_conditions || "",
        exclusions: Array.isArray(data.exclusions)
          ? data.exclusions.join(", ")
          : data.exclusions || "",
      });
    } catch (e) {
      setError("Unable to load policy.");
    }
    setLoading(false);
  };

  const loadPolicies = async () => {
    try {
      const res = await API.get("/admin/policies");
      setPolicies(res.data || []);
    } catch (e) {
      setError("Unable to load policies.");
    }
  };

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    setError("");

    try {
      const name = form.policy_name.trim().toLowerCase();
      const company = form.company_name.trim().toLowerCase();
      const duplicate = policies.find((p) => {
        if (isEdit && String(p.id) === String(id)) return false;
        const pName = (p.policy_name || "").trim().toLowerCase();
        const pCompany = (p.company_name || "").trim().toLowerCase();
        return pName === name && pCompany === company;
      });

      if (duplicate) {
        setError("Policy name already exists for this company.");
        setSaving(false);
        return;
      }

      const payload = {
        ...form,
        supports_smokers: Boolean(form.supports_smokers),
        is_active: Boolean(form.is_active),
        covered_conditions: form.covered_conditions
          ? form.covered_conditions.split(",").map((c) => c.trim()).filter(Boolean)
          : [],
        exclusions: form.exclusions
          ? form.exclusions.split(",").map((c) => c.trim()).filter(Boolean)
          : [],
        company_rating: form.company_rating === "" ? null : form.company_rating,
        waiting_period_days: form.waiting_period_days === "" ? null : form.waiting_period_days,
        copay_percent: form.copay_percent === "" ? null : form.copay_percent,
        claim_settlement_ratio: form.claim_settlement_ratio === "" ? null : form.claim_settlement_ratio,
      };

      if (isEdit) {
        await API.put(`/admin/policies/${id}`, payload);
      } else {
        await API.post("/admin/policies", payload);
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
          required
        />

        {/* COMPANY */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => navigate("/admin/companies/create")}
            className="text-sm font-semibold text-primary-light hover:underline"
          >
            + Add Company
          </button>
          <Select
            label="Company Name"
            value={form.company_name}
            onChange={(e) => updateField("company_name", e.target.value)}
            options={[
              { label: companiesLoading ? "Loading..." : "Select Company", value: "" },
              ...companies.map((c) => ({ label: c.name, value: c.name })),
            ]}
            disabled={companiesLoading}
            required
          />
        </div>

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
          required
        />

        {/* PREMIUM */}
        <Input
          label="Premium Amount (Yearly)"
          type="number"
          value={form.premium_amt}
          onChange={(e) => updateField("premium_amt", e.target.value)}
          required
        />

        {/* COVERAGE */}
        <Input
          label="Coverage Limit"
          value={form.coverage_limit}
          onChange={(e) => updateField("coverage_limit", e.target.value)}
          required
        />

        {/* DESCRIPTION */}
        <TextArea
          label="Policy Description"
          value={form.policy_description}
          onChange={(e) => updateField("policy_description", e.target.value)}
          required
        />

        {/* COMPANY RATING */}
        <Input
          label="Company Rating (1-5)"
          type="number"
          step="0.1"
          value={form.company_rating}
          onChange={(e) => updateField("company_rating", e.target.value)}
          required
        />

        {/* WAITING PERIOD */}
        <Input
          label="Waiting Period (Days)"
          type="number"
          value={form.waiting_period_days}
          onChange={(e) => updateField("waiting_period_days", e.target.value)}
          required
        />

        {/* COPAY */}
        <Input
          label="Copay Percent"
          type="number"
          value={form.copay_percent}
          onChange={(e) => updateField("copay_percent", e.target.value)}
          required
        />

        {/* CLAIM SETTLEMENT RATIO */}
        <Input
          label="Claim Settlement Ratio"
          type="number"
          step="0.1"
          value={form.claim_settlement_ratio}
          onChange={(e) => updateField("claim_settlement_ratio", e.target.value)}
          required
        />

        {/* CONDITIONS */}
        <Input
          label="Covered Conditions (comma separated)"
          value={form.covered_conditions}
          onChange={(e) => updateField("covered_conditions", e.target.value)}
          required
        />

        {/* EXCLUSIONS */}
        <Input
          label="Exclusions (comma separated)"
          value={form.exclusions}
          onChange={(e) => updateField("exclusions", e.target.value)}
          required
        />

        {/* SUPPORTS SMOKERS */}
        <div className="flex items-center gap-3">
          <input
            id="supports_smokers"
            type="checkbox"
            checked={form.supports_smokers}
            onChange={(e) => updateField("supports_smokers", e.target.checked)}
            className="w-5 h-5 rounded border border-slate-400 dark:border-slate-500 bg-white dark:bg-slate-800 accent-primary-light"
          />
          <label
            htmlFor="supports_smokers"
            className="text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Supports Smokers
          </label>
        </div>

        {/* ACTIVE TOGGLE */}
        <div className="flex items-center gap-3">
          <input
            id="active"
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => updateField("is_active", e.target.checked)}
            className="w-5 h-5 rounded border border-slate-400 dark:border-slate-500 bg-white dark:bg-slate-800 accent-primary-light"
          />
          <label
            htmlFor="active"
            className="text-sm font-medium text-slate-700 dark:text-slate-200"
          >
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
