import React, { useEffect, useState } from "react";
import { adminApi as API } from "../utils/adminApi";
import AdminNavbar from "../components/AdminNavbar";
import AdminSidebar from "../components/AdminSidebar";
import { useToast } from "../context/ToastContext";
import { useNavigate, useParams } from "react-router-dom";

const EditCompany = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    description: "",
    agent_id: "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Name is required.";
    if (!form.email.trim()) next.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) next.email = "Enter a valid email.";
    if (!form.phone.trim()) next.phone = "Phone is required.";
    return next;
  };

  const loadCompany = async () => {
    try {
      const res = await API.get(`/admin/companies/${id}`);
      setForm(res.data);
    } catch (error) {
      console.error(error);
      addToast({ title: "Load failed", message: "Unable to fetch company.", type: "error" });
    }
  };

  useEffect(() => {
    loadCompany();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      addToast({ title: "Validation error", message: "Please fix highlighted fields.", type: "error" });
      return;
    }
    try {
      await API.put(`/admin/companies/${id}`, form);
      addToast({ title: "Updated", message: "Company saved.", type: "success" });
      navigate("/admin/companies");
    } catch (error) {
      console.error(error);
      addToast({ title: "Update failed", message: error.response?.data?.message, type: "error" });
    }
  };

  return (
    <div className="admin-layout">
      <AdminNavbar />
      <div className="admin-main">
        <AdminSidebar />
        <div className="admin-content">
          <h2>Edit Company</h2>
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

            <label>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
            ></textarea>

            <label>Agent ID (optional)</label>
            <input
              type="number"
              name="agent_id"
              value={form.agent_id}
              onChange={handleChange}
            />

            <button type="submit" className="btn btn-primary">
              Update Company
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditCompany;
