import React, { useState } from "react";
import { ArrowLeftIcon, EnvelopeIcon, PhoneIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import API from "./api/api";

const ContactUs = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");

    try {
      await API.post("/contact", form); // optional backend
      setSuccess("Your message has been sent successfully!");
      setForm({ name: "", email: "", message: "" });
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
                <label className="text-xs font-semibold opacity-80">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="
                    w-full mt-1 px-3 py-2 rounded-lg text-sm
                    border border-border-light dark:border-border-dark
                    bg-background-light dark:bg-background-dark
                    text-text-light dark:text-text-dark
                    focus:ring-2 focus:ring-primary-light/60 dark:focus:ring-primary-dark
                  "
                  placeholder="Your full name"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold opacity-80">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="
                    w-full mt-1 px-3 py-2 rounded-lg text-sm
                    border border-border-light dark:border-border-dark
                    bg-background-light dark:bg-background-dark
                    text-text-light dark:text-text-dark
                    focus:ring-2 focus:ring-primary-light/60 dark:focus:ring-primary-dark
                  "
                  placeholder="example@gmail.com"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold opacity-80">Message</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="
                    w-full mt-1 px-3 py-2 rounded-lg text-sm h-28 resize-none
                    border border-border-light dark:border-border-dark
                    bg-background-light dark:bg-background-dark
                    text-text-light dark:text-text-dark
                    focus:ring-2 focus:ring-primary-light/60 dark:focus:ring-primary-dark
                  "
                  placeholder="Write your message..."
                  required
                />
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
