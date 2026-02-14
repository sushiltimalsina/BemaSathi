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
  const [agents, setAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
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
    agents: [], // Changed from agent_id to agents array
    is_active: true,
    premium_factor: 1.0,
    age_factor_step: 0.025,
    smoker_factor: 1.35,
    condition_factor: 0.15,
    family_base_factor: 1.20,
    family_member_step: 0.08,
    age_0_2_factor: 1.10,
    age_3_17_factor: 0.80,
    age_18_24_factor: 1.00,
    age_25_plus_base_factor: 1.00,
    region_urban_factor: 1.10,
    region_semi_urban_factor: 1.05,
    region_rural_factor: 1.00,
    loyalty_discount_factor: 0.95,
    bmi_overweight_factor: 1.10,
    bmi_obese_factor: 1.25,
    occ_class_2_factor: 1.15,
    occ_class_3_factor: 1.30,
  });

  useEffect(() => {
    loadCompanies();
    loadAgents();
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

  const loadAgents = async () => {
    try {
      const res = await API.get("/admin/agents");
      setAgents(res.data || []);
    } catch (e) {
      setError("Unable to load agents.");
    }
    setAgentsLoading(false);
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
        agents: Array.isArray(data.agents)
          ? data.agents.map(a => a.id)
          : (data.agent_id ? [data.agent_id] : []), // Support both new and old format
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

  const toggleAgent = (agentId) => {
    setForm((prev) => {
      const agents = prev.agents || [];
      if (agents.includes(agentId)) {
        return { ...prev, agents: agents.filter(id => id !== agentId) };
      } else {
        return { ...prev, agents: [...agents, agentId] };
      }
    });
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

      if (!form.agents || form.agents.length === 0) {
        setError("Please assign at least one agent to this policy.");
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
        agents: form.agents, // Send agents array
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
          bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark
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

        {/* AGENTS - Multi-Select */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Assigned Agents</label>
            <button
              type="button"
              onClick={() => navigate("/admin/agents/create")}
              className="text-xs font-semibold text-primary-light hover:underline"
            >
              + Add Agent
            </button>
          </div>

          {agentsLoading ? (
            <div className="text-sm opacity-60">Loading agents...</div>
          ) : agents.length === 0 ? (
            <div className="text-sm opacity-60">No agents available. Please create an agent first.</div>
          ) : (
            <div className="border border-border-light dark:border-border-dark rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
              {agents.map((agent) => (
                <div key={agent.id} className="flex items-center gap-3">
                  <input
                    id={`agent-${agent.id}`}
                    type="checkbox"
                    checked={form.agents?.includes(agent.id) || false}
                    onChange={() => toggleAgent(agent.id)}
                    className="w-4 h-4 rounded border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark accent-primary-light"
                  />
                  <label
                    htmlFor={`agent-${agent.id}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {agent.name} {agent.company?.name && `(${agent.company.name})`}
                  </label>
                </div>
              ))}
            </div>
          )}

          <p className="text-[10px] opacity-50 italic">
            Users will be able to choose from these assigned agents when purchasing this policy.
          </p>

          {form.agents && form.agents.length > 0 && (
            <div className="text-xs text-primary-light font-medium">
              {form.agents.length} agent{form.agents.length !== 1 ? 's' : ''} selected
            </div>
          )}
        </div>

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

        {/* PRICING FACTORS SECTION */}
        <div className="pt-4 border-t border-border-light dark:border-border-dark space-y-6">
          <h3 className="font-bold text-xl opacity-90 border-b pb-2">Pricing Adjustments</h3>

          <div className="space-y-4">
            <h4 className="font-semibold text-sm opacity-70 italic">General Factors</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Global Multiplier (Base * Factor)"
                type="number" step="0.01"
                value={form.premium_factor}
                onChange={(e) => updateField("premium_factor", e.target.value)}
                placeholder="1.00"
              />
              <Input
                label="Smoker Multiplier"
                type="number" step="0.01"
                value={form.smoker_factor}
                onChange={(e) => updateField("smoker_factor", e.target.value)}
                placeholder="1.35"
              />
              <Input
                label="Per-Condition Loading Factor"
                type="number" step="0.01"
                value={form.condition_factor}
                onChange={(e) => updateField("condition_factor", e.target.value)}
                placeholder="0.15"
              />
              <Input
                label="Family Base Multiplier"
                type="number" step="0.01"
                value={form.family_base_factor}
                onChange={(e) => updateField("family_base_factor", e.target.value)}
                placeholder="1.20"
              />
              <Input
                label="Family Member Increment"
                type="number" step="0.01"
                value={form.family_member_step}
                onChange={(e) => updateField("family_member_step", e.target.value)}
                placeholder="0.08"
              />
              <Input
                label="Loyalty Discount (Multiplier)"
                type="number" step="0.01"
                value={form.loyalty_discount_factor}
                onChange={(e) => updateField("loyalty_discount_factor", e.target.value)}
                placeholder="0.95"
              />
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h4 className="font-semibold text-sm opacity-70 italic">Regional Factors</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Urban Area Loading"
                type="number" step="0.01"
                value={form.region_urban_factor}
                onChange={(e) => updateField("region_urban_factor", e.target.value)}
                placeholder="1.10"
              />
              <Input
                label="Semi-Urban Loading"
                type="number" step="0.01"
                value={form.region_semi_urban_factor}
                onChange={(e) => updateField("region_semi_urban_factor", e.target.value)}
                placeholder="1.05"
              />
              <Input
                label="Rural Area Loading"
                type="number" step="0.01"
                value={form.region_rural_factor}
                onChange={(e) => updateField("region_rural_factor", e.target.value)}
                placeholder="1.00"
              />
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h4 className="font-semibold text-sm opacity-70 italic">Health & Occupation Factors</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="BMI Overweight Loading"
                type="number" step="0.01"
                value={form.bmi_overweight_factor}
                onChange={(e) => updateField("bmi_overweight_factor", e.target.value)}
                placeholder="1.10"
              />
              <Input
                label="BMI Obese Loading"
                type="number" step="0.01"
                value={form.bmi_obese_factor}
                onChange={(e) => updateField("bmi_obese_factor", e.target.value)}
                placeholder="1.25"
              />
              <Input
                label="Occupation Class 2 (Field/Risk)"
                type="number" step="0.01"
                value={form.occ_class_2_factor}
                onChange={(e) => updateField("occ_class_2_factor", e.target.value)}
                placeholder="1.15"
              />
              <Input
                label="Occupation Class 3 (Manual/High Risk)"
                type="number" step="0.01"
                value={form.occ_class_3_factor}
                onChange={(e) => updateField("occ_class_3_factor", e.target.value)}
                placeholder="1.30"
              />
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h4 className="font-semibold text-sm opacity-70 italic">Age Group Factors</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Age 0-2 (Infant) Base Factor"
                type="number" step="0.01"
                value={form.age_0_2_factor}
                onChange={(e) => updateField("age_0_2_factor", e.target.value)}
                placeholder="1.10"
              />
              <Input
                label="Age 3-17 (Child) Base Factor"
                type="number" step="0.01"
                value={form.age_3_17_factor}
                onChange={(e) => updateField("age_3_17_factor", e.target.value)}
                placeholder="0.80"
              />
              <Input
                label="Age 18-24 (Adult) Base Factor"
                type="number" step="0.01"
                value={form.age_18_24_factor}
                onChange={(e) => updateField("age_18_24_factor", e.target.value)}
                placeholder="1.00"
              />
              <Input
                label="Age 25+ Base Factor"
                type="number" step="0.01"
                value={form.age_25_plus_base_factor}
                onChange={(e) => updateField("age_25_plus_base_factor", e.target.value)}
                placeholder="1.00"
              />
              <Input
                label="Age 25+ Yearly Increment (Per Year)"
                type="number" step="0.001"
                value={form.age_factor_step}
                onChange={(e) => updateField("age_factor_step", e.target.value)}
                placeholder="0.025"
              />
            </div>
          </div>
        </div>

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
            className="w-5 h-5 rounded border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark accent-primary-light"
          />
          <label
            htmlFor="supports_smokers"
            className="text-sm font-mediumtext-black dark:text-white"
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
            className="w-5 h-5 rounded border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark accent-primary-light"
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
        bg-card-light dark:bg-card-dark
        border-border-light dark:border-border-dark
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
        bg-card-light dark:bg-card-dark
        border-border-light dark:border-border-dark
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
        bg-card-light dark:bg-card-dark
        border-border-light dark:border-border-dark
        focus:outline-none
      "
    ></textarea>
  </div>
);

export default PolicyForm;
