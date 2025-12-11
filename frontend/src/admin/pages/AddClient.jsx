import React, { useState } from "react";
import { adminApi as API } from "../utils/adminApi";
import AdminNavbar from "../components/AdminNavbar";
import AdminSidebar from "../components/AdminSidebar";
import { useToast } from "../context/ToastContext";
import { useNavigate } from "react-router-dom";

const AddClient = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    policy_id: "",
    policy_provided: false,
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Name is required.";
    if (!form.email.trim()) next.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) next.email = "Enter a valid email.";
    if (!form.phone.trim()) next.phone = "Phone is required.";
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      addToast({ title: "Validation error", message: "Please fix highlighted fields.", type: "error" });
      return;
    }
    try {
      await API.post("/admin/clients", form);
      addToast({ title: "Success", message: "Client added.", type: "success" });
      navigate("/admin/clients");
    } catch (error) {
      console.error(error);
      addToast({ title: "Failed to add client", message: error.response?.data?.message, type: "error" });
    }
  };

  return (
    <div className="admin-layout">
      <AdminNavbar />
      <div className="admin-main">
        <AdminSidebar />
        <div className="admin-content">
          <h2>Add Client</h2>
          <form className="form" onSubmit={handleSubmit}>
            <label>Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className={errors.name ? "input-error" : ""}
              required
            />
            {errors.name && <div className="field-error">{errors.name}</div>}

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

            <label>Phone</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className={errors.phone ? "input-error" : ""}
              required
            />
            {errors.phone && <div className="field-error">{errors.phone}</div>}

            <label>Address</label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
            />

            <label>Policy ID (optional)</label>
            <input
              type="number"
              name="policy_id"
              value={form.policy_id}
              onChange={handleChange}
            />

            <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                name="policy_provided"
                checked={form.policy_provided}
                onChange={handleChange}
              />
              Policy Provided
            </label>

            <button type="submit" className="btn btn-primary">
              Add Client
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddClient;
