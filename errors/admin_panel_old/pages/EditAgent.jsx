import React, { useEffect, useState } from "react";
import { adminApi as API } from "../utils/adminApi";
import { useNavigate, useParams } from "react-router-dom";
import AdminNavbar from "../components/AdminNavbar";
import AdminSidebar from "../components/AdminSidebar";
import { useToast } from "../context/ToastContext";

const EditAgent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    company_name: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const response = await API.get(`/admin/agents/${id}`);
        setForm(response.data);
      } catch (error) {
        console.error(error);
        addToast({ title: "Load failed", message: "Unable to fetch agent.", type: "error" });
      }
    };

    fetchAgent();
  }, [id]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Name is required.";
    if (!form.phone.trim()) next.phone = "Phone is required.";
    if (!form.email.trim()) next.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) next.email = "Enter a valid email.";
    if (!form.company_name.trim()) next.company_name = "Company is required.";
    return next;
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      addToast({ title: "Validation error", message: "Please fix the highlighted fields.", type: "error" });
      return;
    }

    try {
      await API.put(`/admin/agents/${id}`, form);
      addToast({ title: "Updated", message: "Agent saved.", type: "success" });
      navigate("/admin/agents");
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
          <h2>Edit Agent</h2>

          <form className="form" onSubmit={handleUpdate}>
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

            <label>Company Name</label>
            <input
              type="text"
              name="company_name"
              value={form.company_name}
              onChange={handleChange}
              className={errors.company_name ? "input-error" : ""}
              required
            />
            {errors.company_name && <div className="field-error">{errors.company_name}</div>}

            <button type="submit" className="btn btn-primary">
              Update Agent
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditAgent;
