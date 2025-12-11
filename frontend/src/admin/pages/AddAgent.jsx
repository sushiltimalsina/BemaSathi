import React, { useEffect, useState } from "react";
import { adminApi as API } from "../utils/adminApi";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "../components/AdminNavbar";
import AdminSidebar from "../components/AdminSidebar";
import { useToast } from "../context/ToastContext";

const AddAgent = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    company_id: "",
  });
  const [errors, setErrors] = useState({});
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextForm = { ...form, [name]: value };

    // Derive company_name for clarity when selecting company
    if (name === "company_id") {
      const selected = companies.find((c) => String(c.id) === String(value));
      nextForm.company_name = selected ? selected.name || selected.company_name : "";
    }

    setForm(nextForm);
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  useEffect(() => {
    const loadCompanies = async () => {
      setLoadingCompanies(true);
      try {
        const res = await API.get("/admin/companies");
        setCompanies(res.data || []);
      } catch (err) {
        console.error("Load companies failed", err);
        addToast({ title: "Load failed", message: "Could not load companies.", type: "error" });
      }
      setLoadingCompanies(false);
    };
    loadCompanies();
  }, [addToast]);

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Name is required.";
    if (!form.phone.trim()) next.phone = "Phone is required.";
    if (!form.email.trim()) next.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) next.email = "Enter a valid email.";
    if (!form.company_id) next.company_id = "Company is required.";
    return next;
  };

  const handleAdd = async (e) => {
    e.preventDefault();

    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      addToast({ title: "Validation error", message: "Please fix the highlighted fields.", type: "error" });
      return;
    }

    try {
      await API.post("/admin/agents", form);
      addToast({ title: "Success", message: "Agent added.", type: "success" });
      navigate("/admin/agents");
    } catch (error) {
      console.error(error);
      addToast({ title: "Failed to add agent", message: error.response?.data?.message, type: "error" });
    }
  };

  return (
    <div className="admin-layout">
      <AdminNavbar />
      <div className="admin-main">
        <AdminSidebar />
        <div className="admin-content">
          <h2>Add New Agent</h2>

          <form className="form" onSubmit={handleAdd}>
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className={errors.name ? "input-error" : ""}
              required
            />
            {errors.name && <div className="field-error">{errors.name}</div>}

            <label>Phone</label>
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className={errors.phone ? "input-error" : ""}
              required
            />
            {errors.phone && <div className="field-error">{errors.phone}</div>}

            <label>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className={errors.email ? "input-error" : ""}
              required
            />
            {errors.email && <div className="field-error">{errors.email}</div>}

            <label>Company</label>
            <select
              name="company_id"
              value={form.company_id}
              onChange={handleChange}
              className={`select-field ${errors.company_id ? "input-error" : ""}`}
              required
            >
              <option value="">{loadingCompanies ? "Loading..." : "Select company"}</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || c.company_name}
                </option>
              ))}
            </select>
            {errors.company_id && <div className="field-error">{errors.company_id}</div>}

            <button type="submit" className="btn btn-primary">
              Add Agent
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddAgent;
