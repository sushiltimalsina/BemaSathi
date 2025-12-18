import React, { useEffect, useState } from "react";
import API from "../../../api/api";
import { CheckCircleIcon } from "@heroicons/react/24/outline";

const Settings = () => {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");

  const [form, setForm] = useState({
    // Renewal
    renewal_grace_days: 7,
    default_billing_cycle: "yearly",

    // Payment Keys
    esewa_merchant_id: "",
    esewa_secret_key: "",
    khalti_public_key: "",
    khalti_secret_key: "",

    // Email Settings
    smtp_host: "",
    smtp_port: 587,
    smtp_username: "",
    smtp_password: "",
    mail_from_name: "",
    mail_from_address: "",

    // Branding
    system_name: "BeemaSathi",
    website_url: "",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await API.get("/admin/settings");
      setForm((prev) => ({ ...prev, ...(res.data || {}) }));
    } catch (e) {
      console.error("Unable to load settings.");
    }
    setLoading(false);
  };

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    setSuccessMsg("");

    try {
      await API.post("/admin/settings", form);
      setSuccessMsg("Settings saved successfully.");
    } catch (e) {
      console.error(e);
      alert("Failed to save settings.");
    }

    setSaving(false);
  };

  if (loading)
    return <p className="opacity-70">Loading settings...</p>;

  return (
    <div className="space-y-10 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">System Settings</h1>

        <button
          onClick={save}
          disabled={saving}
          className="
            px-5 py-2 rounded-lg font-semibold text-white
            bg-primary-light hover:bg-primary-dark
            disabled:opacity-60
          "
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {successMsg && (
        <div className="p-3 rounded-lg bg-green-200/20 border border-green-500 text-green-700 flex items-center gap-2">
          <CheckCircleIcon className="w-5 h-5" />
          {successMsg}
        </div>
      )}

      {/* RENEWAL SETTINGS */}
      <Section title="Renewal Settings">
        <Input
          label="Renewal Grace Period (days)"
          type="number"
          value={form.renewal_grace_days}
          onChange={(e) => update("renewal_grace_days", e.target.value)}
        />

        <Select
          label="Default Billing Cycle"
          value={form.default_billing_cycle}
          onChange={(e) => update("default_billing_cycle", e.target.value)}
          options={[
            { label: "Yearly", value: "yearly" },
            { label: "Half-Yearly", value: "half_yearly" },
            { label: "Quarterly", value: "quarterly" },
            { label: "Monthly", value: "monthly" },
          ]}
        />
      </Section>

      {/* PAYMENT SETTINGS */}
      <Section title="Payment Gateway Settings">
        <Input
          label="eSewa Merchant ID"
          value={form.esewa_merchant_id}
          onChange={(e) => update("esewa_merchant_id", e.target.value)}
        />

        <Input
          label="eSewa Secret Key"
          value={form.esewa_secret_key}
          onChange={(e) => update("esewa_secret_key", e.target.value)}
        />

        <Input
          label="Khalti Public Key"
          value={form.khalti_public_key}
          onChange={(e) => update("khalti_public_key", e.target.value)}
        />

        <Input
          label="Khalti Secret Key"
          value={form.khalti_secret_key}
          onChange={(e) => update("khalti_secret_key", e.target.value)}
        />
      </Section>

      {/* EMAIL SETTINGS */}
      <Section title="Email (SMTP) Settings">
        <Input
          label="SMTP Host"
          value={form.smtp_host}
          onChange={(e) => update("smtp_host", e.target.value)}
        />
        <Input
          label="SMTP Port"
          value={form.smtp_port}
          type="number"
          onChange={(e) => update("smtp_port", e.target.value)}
        />
        <Input
          label="SMTP Username"
          value={form.smtp_username}
          onChange={(e) => update("smtp_username", e.target.value)}
        />
        <Input
          label="SMTP Password"
          type="password"
          value={form.smtp_password}
          onChange={(e) => update("smtp_password", e.target.value)}
        />
        <Input
          label='"Mail From" Name'
          value={form.mail_from_name}
          onChange={(e) => update("mail_from_name", e.target.value)}
        />
        <Input
          label='"Mail From" Email'
          value={form.mail_from_address}
          onChange={(e) => update("mail_from_address", e.target.value)}
        />
      </Section>

      {/* BRANDING SETTINGS */}
      <Section title="Branding Settings">
        <Input
          label="System Name"
          value={form.system_name}
          onChange={(e) => update("system_name", e.target.value)}
        />
        <Input
          label="Website URL"
          value={form.website_url}
          onChange={(e) => update("website_url", e.target.value)}
        />
      </Section>
    </div>
  );
};

/* REUSABLE COMPONENTS */

const Section = ({ title, children }) => (
  <div
    className="
      bg-white dark:bg-slate-900 rounded-xl border border-slate-200
      dark:border-slate-800 p-6 shadow-sm space-y-6
    "
  >
    <h2 className="text-lg font-semibold">{title}</h2>
    {children}
  </div>
);

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
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </div>
);

export default Settings;
