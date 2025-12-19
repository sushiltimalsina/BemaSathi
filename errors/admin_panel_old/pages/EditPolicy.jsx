import React, { useEffect, useState } from "react";
import { adminApi as API, fetchCompanies } from "../utils/adminApi";
import { useNavigate, useParams } from "react-router-dom";
import AdminNavbar from "../components/AdminNavbar";
import AdminSidebar from "../components/AdminSidebar";
import { useToast } from "../context/ToastContext";

const INSURANCE_TYPES = [
  { value: "health", label: "Health" },
  { value: "term-life", label: "Term Life" },
  { value: "whole-life", label: "Whole Life" },
];

const EditPolicy = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [form, setForm] = useState({
    insurance_type: "",
    company_name: "",
    policy_name: "",        // ADDED
    premium_amt: "",
    coverage_limit: "",
    policy_description: "",
    company_rating: "",
    agent_id: "",
  });

  const [errors, setErrors] = useState({});
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);

  // Fetch policy details
  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const response = await API.get(`/admin/policies/${id}`);
        setForm(response.data);
      } catch (error) {
        console.error(error);
        addToast({
          title: "Load failed",
          message: "Unable to fetch policy.",
          type: "error",
        });
      }
    };

    fetchPolicy();
  }, [id]);

  // Load companies
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
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const validate = () => {
    const next = {};

    // insurance type
    if (!form.insurance_type) {
      next.insurance_type = "Type is required.";
    } else if (!INSURANCE_TYPES.find((t) => t.value === form.insurance_type)) {
      next.insurance_type = "Choose a valid insurance type.";
    }

    // company name
    if (!form.company_name) {
      next.company_name = "Company is required.";
    } else if (
      companies.length &&
      !companies.find((c) => c.name === form.company_name)
    ) {
      next.company_name = "Choose a company from the list.";
    }

    // policy name
    if (!form.policy_name.trim()) {
      next.policy_name = "Policy name is required.";
    }

    // premium
    if (!form.premium_amt) next.premium_amt = "Premium is required.";

    // coverage
    if (!form.coverage_limit) next.coverage_limit = "Coverage is required.";

    // rating
    if (
      form.company_rating &&
      (form.company_rating < 0 || form.company_rating > 5)
    ) {
      next.company_rating = "Rating must be 0–5.";
    }

    return next;
  };

  const handleUpdate = async (e) => {
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
      await API.put(`/admin/policies/${id}`, form);
      addToast({
        title: "Updated",
        message: "Policy saved.",
        type: "success",
      });
      navigate("/admin/policies");
    } catch (error) {
      console.error(error);
      addToast({
        title: "Update failed",
        message: error.response?.data?.message,
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
          <h2>Edit Policy</h2>

          <form className="form" onSubmit={handleUpdate}>
            
            {/* INSURANCE TYPE */}
            <div className="field-label">
              <label>Insurance Type</label>
              <span className="field-sub">Standard categories</span>
            </div>

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
                {companiesLoading
                  ? "Loading companies..."
                  : "Select a company"}
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
              placeholder="e.g., Health Gold, Term Shield Plus"
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

            {/* AGENT ID */}
            <label>Agent ID</label>
            <input
              type="number"
              name="agent_id"
              value={form.agent_id}
              onChange={handleChange}
            />

            <button type="submit" className="btn btn-primary">
              Update Policy
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditPolicy;