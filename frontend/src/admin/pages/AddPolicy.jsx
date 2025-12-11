import React, { useEffect, useState } from "react";
import { adminApi as API, fetchCompanies } from "../utils/adminApi";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "../components/AdminNavbar";
import AdminSidebar from "../components/AdminSidebar";
import { useToast } from "../context/ToastContext";

const INSURANCE_TYPES = [
  { value: "health", label: "Health" },
  { value: "term-life", label: "Term Life" },
  { value: "whole-life", label: "Whole Life" },
];

const PRE_EXISTING_OPTIONS = [
  "diabetes",
  "heart",
  "hypertension",
  "asthma",
];

const AddPolicy = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [form, setForm] = useState({
    insurance_type: "",
    company_name: "",
    policy_name: "",
    premium_amt: "",
    coverage_limit: "",
    policy_description: "",
    company_rating: "",
    agent_id: "",
    agent_name: "",

    // NEW FIELDS
    covered_conditions: [],
    supports_smokers: "1",
    waiting_period_days: "",
    copay_percent: "",
    exclusions: [],
    claim_settlement_ratio: "",

  });

  const [errors, setErrors] = useState({});
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [agents, setAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(true);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const toggleCondition = (value, checked) => {
    setForm((prev) => ({
      ...prev,
      covered_conditions: checked
        ? [...prev.covered_conditions, value]
        : prev.covered_conditions.filter((c) => c !== value),
    }));
  };

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const res = await fetchCompanies();
        setCompanies(res.data || []);
      } catch (error) {
        console.error(error);
        addToast({
          title: "Load failed",
          message: "Unable to fetch companies.",
          type: "error",
        });
      } finally {
        setCompaniesLoading(false);
      }
    };

    loadCompanies();

    const loadAgents = async () => {
      try {
        const res = await API.get("/admin/agents");
        setAgents(res.data || []);
      } catch (error) {
        console.error(error);
        addToast({
          title: "Load failed",
          message: "Unable to fetch agents.",
          type: "error",
        });
      } finally {
        setAgentsLoading(false);
      }
    };

    loadAgents();
  }, []);

  const validate = () => {
    const next = {};

    if (!form.insurance_type) next.insurance_type = "Type is required.";
    if (!form.company_name) next.company_name = "Company is required.";
    if (!form.policy_name.trim())
      next.policy_name = "Policy name is required.";
    if (!form.premium_amt) next.premium_amt = "Premium is required.";
    if (!form.coverage_limit) next.coverage_limit = "Coverage is required.";
    if (!form.agent_id) next.agent_id = "Agent selection is required.";

    if (
      form.company_rating &&
      (form.company_rating < 0 || form.company_rating > 5)
    ) {
      next.company_rating = "Rating must be between 0-5.";
    }

    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      addToast({
        title: "Validation error",
        message: "Please fix the highlighted fields.",
        type: "error",
      });
      return;
    }

    try {
      await API.post("/admin/policies", {
        ...form,
        agent_id: form.agent_id || undefined,
        agent_name: undefined, // not used in backend, only for select
        // Convert to boolean
        supports_smokers: form.supports_smokers === "1",
      });

      addToast({
        title: "Success",
        message: "Policy added successfully.",
        type: "success",
      });

      navigate("/admin/policies");
    } catch (error) {
      console.error(error);
      addToast({
        title: "Failed to add policy",
        message: error.response?.data?.message || "Error occurred",
        type: "error",
      });
    }
  };

  return (
    <div className="admin-layout">
      <AdminNavbar />
      <div className="admin-main">
        <AdminSidebar />
        <div className="admin-content">
          <h2>Add New Policy</h2>

          <form className="form" onSubmit={handleSubmit}>
            
            {/* INSURANCE TYPE */}
            <label>Insurance Type</label>
            <select
              name="insurance_type"
              value={form.insurance_type}
              onChange={handleChange}
              className={`select-field ${errors.insurance_type ? "input-error" : ""}`}
            >
              <option value="">Select an insurance type</option>
              {INSURANCE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.insurance_type && (
              <div className="field-error">{errors.insurance_type}</div>
            )}

            {/* COMPANY NAME */}
            <div className="field-inline">
              <label>Company Name</label>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => navigate("/admin/companies/add")}
              >
                + Add Company
              </button>
            </div>

            <select
              name="company_name"
              value={form.company_name}
              onChange={handleChange}
              className={`select-field ${errors.company_name ? "input-error" : ""}`}
              disabled={companiesLoading || !companies.length}
            >
              <option value="">
                {companiesLoading ? "Loading companies..." : "Select a company"}
              </option>
              {!companiesLoading &&
                companies.map((company) => (
                  <option key={company.id} value={company.name}>
                    {company.name}
                  </option>
                ))}
            </select>

            {errors.company_name && (
              <div className="field-error">{errors.company_name}</div>
            )}

            {/* POLICY NAME */}
            <label>Policy Name</label>
            <input
              type="text"
              name="policy_name"
              value={form.policy_name}
              onChange={handleChange}
              className={errors.policy_name ? "input-error" : ""}
              placeholder="e.g., Health Gold, Term Shield Plan"
            />
            {errors.policy_name && (
              <div className="field-error">{errors.policy_name}</div>
            )}

            {/* PREMIUM */}
            <label>Premium Amount</label>
            <input
              type="number"
              name="premium_amt"
              value={form.premium_amt}
              onChange={handleChange}
              className={errors.premium_amt ? "input-error" : ""}
            />
            {errors.premium_amt && (
              <div className="field-error">{errors.premium_amt}</div>
            )}

            {/* COVERAGE */}
            <label>Coverage Limit</label>
            <input
              type="number"
              name="coverage_limit"
              value={form.coverage_limit}
              onChange={handleChange}
              className={errors.coverage_limit ? "input-error" : ""}
            />
            {errors.coverage_limit && (
              <div className="field-error">{errors.coverage_limit}</div>
            )}

            {/* DESCRIPTION */}
            <label>Policy Description</label>
            <textarea
              name="policy_description"
              value={form.policy_description}
              onChange={handleChange}
            ></textarea>

            {/* RATING */}
            <label>Company Rating (0–5)</label>
            <input
              type="number"
              name="company_rating"
              step="0.1"
              value={form.company_rating}
              onChange={handleChange}
              className={errors.company_rating ? "input-error" : ""}
            />
            {errors.company_rating && (
              <div className="field-error">{errors.company_rating}</div>
            )}

            {/* NEW FIELD — COVERED CONDITIONS */}
            <label>Covered Conditions</label>
            <div className="conditions-grid">
              {PRE_EXISTING_OPTIONS.map((cond) => (
                <label key={cond} className="checkbox-label">
                  <input
                    type="checkbox"
                    value={cond}
                    checked={form.covered_conditions.includes(cond)}
                    onChange={(e) => toggleCondition(cond, e.target.checked)}
                  />
                  <span className="capitalize">{cond}</span>
                </label>
              ))}
            </div>

            {/* NEW FIELD — SUPPORTS SMOKERS */}
            <label>Supports Smokers</label>
            <select
              name="supports_smokers"
              value={form.supports_smokers}
              onChange={handleChange}
              className="select-field"
            >
              <option value="1">Yes</option>
              <option value="0">No</option>
            </select>
            <label>Waiting Period (Days)</label>
<input
  type="number"
  name="waiting_period_days"
  value={form.waiting_period_days}
  onChange={handleChange}
/>
<label>Co-Pay (%)</label>
<input
  type="number"
  name="copay_percent"
  value={form.copay_percent}
  onChange={handleChange}
/>
<label>Exclusions (comma separated)</label>
<input
  type="text"
  name="exclusions"
  placeholder="dental, cosmetic surgery, fertility treatment"
  onChange={(e) =>
    setForm({ ...form, exclusions: e.target.value.split(",").map(x => x.trim()) })
  }
/>
<label>Claim Settlement Ratio (%)</label>
<input
  type="number"
  name="claim_settlement_ratio"
  value={form.claim_settlement_ratio}
  onChange={handleChange}
/>


            {/* AGENT SELECT */}
            <div className="field-inline">
              <label>Assign Agent</label>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => navigate("/admin/agents/add")}
              >
                + Add Agent
              </button>
            </div>
            <select
              name="agent_id"
              value={form.agent_id}
              onChange={handleChange}
              className="select-field"
              disabled={agentsLoading || !agents.length}
            >
              <option value="">
                {agentsLoading ? "Loading agents..." : "Select an agent"}
              </option>
              {!agentsLoading &&
                agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
            </select>
            {errors.agent_id && (
              <div className="field-error">{errors.agent_id}</div>
            )}
            {!agentsLoading && !agents.length && (
              <div className="field-hint">
                No agents available. Add an agent to assign.
              </div>
            )}

            <button type="submit" className="btn btn-primary">
              Add Policy
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddPolicy;
