import React, { useState, useEffect } from "react";
import { ArrowLeftIcon, EnvelopeIcon, PhoneIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import API from "./api/api";

const ContactUs = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    policy_id: "",
    message: "",
  });

  const [policies, setPolicies] = useState([]);

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const res = await API.get("/policies");
        if (res.data && res.data.data) {
          setPolicies(res.data.data);
        } else if (Array.isArray(res.data)) {
          setPolicies(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch policies for contact form", err);
      }
    };
    fetchPolicies();
  }, []);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const validateField = (name, value) => {
    let error = null;
    if (name === "name") {
      if (!value.trim()) error = "Name is required.";
    } else if (name === "email") {
      if (!value.trim()) error = "Email is required.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = "Please enter a valid email address.";
    } else if (name === "phone") {
      if (!value.trim()) error = "Phone number is required.";
      else if (!/^\+?[\d\s-]{7,15}$/.test(value)) error = "Please enter a valid phone number.";
    } else if (name === "message") {
      if (!value.trim()) error = "Message cannot be empty.";
      else if (value.trim().length < 10) error = "Message must be at least 10 characters long.";
    }

    setFieldErrors((prev) => ({ ...prev, [name]: error }));
    return error === null;
  };

  const validateAll = () => {
    const isNameValid = validateField("name", form.name);
    const isEmailValid = validateField("email", form.email);
    const isPhoneValid = validateField("phone", form.phone);
    const isMessageValid = validateField("message", form.message);
    return isNameValid && isEmailValid && isPhoneValid && isMessageValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");

    if (!validateAll()) {
      return;
    }

    setLoading(true);

    try {
      await API.post("/contact", {
        ...form,
        policy_id: form.policy_id ? parseInt(form.policy_id, 10) : null
      }); 
      setSuccess("Your message has been sent successfully!");
      setForm({ name: "", email: "", phone: "", policy_id: "", message: "" });
    } catch {
      setError("Failed to send message. Try again.");
    }

    setLoading(false);
  };

  return (
    <div
      className="
        min-h-screen
        bg-background-light dark:bg-background-dark
        text-text-light dark:text-text-dark
        transition-colors px-6 py-10
      "
    >
      <div className="max-w-4xl mx-auto">

        {/* BACK BUTTON */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 opacity-70 hover:opacity-100 mb-6"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back
        </button>

        {/* TITLE */}
        <h1 className="text-3xl font-bold mb-8">Contact Us</h1>

        <div className="grid md:grid-cols-2 gap-8">

          {/* CONTACT INFO BOX */}
          <div className="bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-2xl p-8 shadow">
            <h2 className="text-xl font-semibold mb-4">Get In Touch</h2>
            <p className="text-sm opacity-80 leading-relaxed mb-6">
              Have questions, issues, or feedback?  
              Reach out to our support team anytime.
            </p>

            <div className="space-y-4 text-sm">

              <div className="flex items-center gap-3">
                <EnvelopeIcon className="w-5 h-5 text-primary-light dark:text-primary-dark" />
                <span>support@beemasathi.com</span>
              </div>

              <div className="flex items-center gap-3">
                <PhoneIcon className="w-5 h-5 text-green-600" />
                <span>+977-9867060553</span>
              </div>

              <div className="flex items-center gap-3">
                <MapPinIcon className="w-5 h-5 text-red-500" />
                <span>Kathmandu, Nepal</span>
              </div>

            </div>
          </div>

          {/* FORM */}
          <div className="bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-2xl p-8 shadow">
            <h2 className="text-xl font-semibold mb-4">Send Us a Message</h2>

            {success && (
              <p className="text-green-600 text-sm mb-3 font-medium">{success}</p>
            )}
            {error && (
              <p className="text-red-500 text-sm mb-3 font-medium">{error}</p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              <div>
                <label className="text-xs font-semibold opacity-80">Full Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value });
                    if (fieldErrors.name) validateField("name", e.target.value);
                  }}
                  onBlur={(e) => validateField("name", e.target.value)}
                  className={`
                    w-full mt-1 px-3 py-2 rounded-lg text-sm
                    border ${fieldErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-border-light dark:border-border-dark focus:ring-primary-light/60 dark:focus:ring-primary-dark'}
                    bg-background-light dark:bg-background-dark
                    text-text-light dark:text-text-dark
                    focus:ring-2
                  `}
                  placeholder="Your full name"
                />
                {fieldErrors.name && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold opacity-80">Email Address <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => {
                    setForm({ ...form, email: e.target.value });
                    if (fieldErrors.email) validateField("email", e.target.value);
                  }}
                  onBlur={(e) => validateField("email", e.target.value)}
                  className={`
                    w-full mt-1 px-3 py-2 rounded-lg text-sm
                    border ${fieldErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-border-light dark:border-border-dark focus:ring-primary-light/60 dark:focus:ring-primary-dark'}
                    bg-background-light dark:bg-background-dark
                    text-text-light dark:text-text-dark
                    focus:ring-2
                  `}
                  placeholder="john@example.com"
                />
                {fieldErrors.email && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold opacity-80">Phone Number <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => {
                    setForm({ ...form, phone: e.target.value });
                    if (fieldErrors.phone) validateField("phone", e.target.value);
                  }}
                  onBlur={(e) => validateField("phone", e.target.value)}
                  className={`
                    w-full mt-1 px-3 py-2 rounded-lg text-sm
                    border ${fieldErrors.phone ? 'border-red-500 focus:ring-red-500' : 'border-border-light dark:border-border-dark focus:ring-primary-light/60 dark:focus:ring-primary-dark'}
                    bg-background-light dark:bg-background-dark
                    text-text-light dark:text-text-dark
                    focus:ring-2
                  `}
                  placeholder="+977-9800000000"
                />
                {fieldErrors.phone && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold opacity-80">Do you have a question about a specific policy? <span className="text-gray-400 font-normal">(Optional)</span></label>
                <select
                  value={form.policy_id}
                  onChange={(e) => setForm({ ...form, policy_id: e.target.value })}
                  className="
                    w-full mt-1 px-3 py-2 rounded-lg text-sm
                    border border-border-light dark:border-border-dark
                    bg-background-light dark:bg-background-dark
                    text-text-light dark:text-text-dark
                    focus:ring-2 focus:ring-primary-light/60 dark:focus:ring-primary-dark
                  "
                >
                  <option value="">-- General Question (No Policy) --</option>
                  {policies.map(policy => (
                    <option key={policy.id} value={policy.id}>
                      {policy.name || policy.policy_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold opacity-80">Message <span className="text-red-500">*</span></label>
                <textarea
                  value={form.message}
                  onChange={(e) => {
                    setForm({ ...form, message: e.target.value });
                    if (fieldErrors.message) validateField("message", e.target.value);
                  }}
                  onBlur={(e) => validateField("message", e.target.value)}
                  className={`
                    w-full mt-1 px-3 py-2 rounded-lg text-sm
                    border ${fieldErrors.message ? 'border-red-500 focus:ring-red-500' : 'border-border-light dark:border-border-dark focus:ring-primary-light/60 dark:focus:ring-primary-dark'}
                    bg-background-light dark:bg-background-dark
                    text-text-light dark:text-text-dark
                    focus:ring-2
                  `}
                  rows={4}
                  placeholder="How can we help you?"
                ></textarea>
                {fieldErrors.message && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-lg text-white font-semibold text-sm transition ${
                  loading
                    ? "bg-primary-light/50 dark:bg-primary-dark/50 cursor-not-allowed"
                    : "bg-primary-light dark:bg-primary-dark hover:opacity-90"
                }`}
              >
                {loading ? "Sending..." : "Send Message"}
              </button>

            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ContactUs;
