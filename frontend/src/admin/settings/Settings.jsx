import React, { useEffect, useState } from "react";
import API from "../utils/adminApi";
import { CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useAdminToast } from "../ui/AdminToast";
import { useAdminConfirm } from "../ui/AdminConfirm";

const Settings = () => {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const { addToast } = useAdminToast();
  const confirm = useAdminConfirm();

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
  useEffect(() => {
    const refresh = () => {
      if (!saving && !isDirty) {
        loadSettings();
      }
    };

    const intervalId = setInterval(refresh, 15000);
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [saving, isDirty]);

  const loadSettings = async (source = "cache") => {
    try {
      const res = await API.get("/admin/settings", {
        params:
          source === "env"
            ? { source: "env", _ts: Date.now() }
            : { _ts: Date.now() },
      });
      setForm((prev) => ({ ...prev, ...(res.data || {}) }));
      setIsDirty(false);
    } catch (e) {
      console.error("Unable to load settings.");
    }
    setLoading(false);
  };

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const save = async () => {
    const ok = await confirm("Save these settings and apply them now?", {
      title: "Save Settings",
      confirmText: "Save",
    });
    if (!ok) return;
    setSaving(true);
    setSuccessMsg("");

    try {
      await API.post("/admin/settings", form);
      setSuccessMsg("Settings saved successfully.");
      setIsDirty(false);
      loadSettings();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (e) {
      console.error(e);
      addToast({ type: "error", title: "Save failed", message: "Failed to save settings." });
    }

    setSaving(false);
  };

  const confirmLoadEnv = async () => {
    const ok = await confirm("Load values directly from the backend .env file?", {
      title: "Load from .env",
      confirmText: "Load",
    });
    if (!ok) return;
    loadSettings("env");
  };

  const confirmLoadSaved = async () => {
    const ok = await confirm("Load the last saved settings from the backend?", {
      title: "Load Saved Settings",
      confirmText: "Load",
    });
    if (!ok) return;
    loadSettings("cache");
  };

  if (loading)
    return <p className="opacity-70">Loading settings...</p>;

  return (
    <div className="space-y-10 max-w-4xl">
      <div className="rounded-xl border border-amber-200/70 dark:border-amber-800/50 bg-amber-50/80 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-800 flex items-start gap-2">
        <ExclamationTriangleIcon className="w-5 h-5 mt-0.5" />
        Warning: Changes here affect the overall system flow. Unintended edits
        can break critical features.
      </div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">System Settings</h1>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={confirmLoadEnv}
              disabled={saving}
              className="
                px-4 py-2 rounded-lg font-semibold
                border border-border-light dark:border-border-dark
                bg-card-light dark:bg-card-dark
                text-text-light dark:text-text-dark
                hover:bg-hover-light dark:hover:bg-hover-dark
                disabled:opacity-60
              "
              title="Pull the latest values directly from the backend .env file"
            >
              Use .env values
            </button>
            <button
              onClick={confirmLoadSaved}
              disabled={saving}
              className="
                px-4 py-2 rounded-lg font-semibold
                border border-border-light dark:border-border-dark
                bg-card-light dark:bg-card-dark
                text-text-light dark:text-text-dark
                hover:bg-hover-light dark:hover:bg-hover-dark
                disabled:opacity-60
              "
              title="Load the last saved settings stored in the backend"
            >
              Use saved settings
            </button>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="
              px-5 py-2 rounded-lg font-semibold text-white
              bg-primary-light hover:bg-primary-dark
              disabled:opacity-60
            "
          >
            {saving ? "Applying..." : "Apply & Save"}
          </button>
        </div>
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
          hint="Number of days after due date before renewal is marked overdue."
          hintPath="backend/.env"
          hintKey="RENEWAL_GRACE_DAYS"
          type="number"
          value={form.renewal_grace_days}
          onChange={(e) => update("renewal_grace_days", e.target.value)}
        />

        <Select
          label="Default Billing Cycle"
          hint="Used as the default cycle when creating a new policy purchase."
          hintPath="backend/.env"
          hintKey="DEFAULT_BILLING_CYCLE"
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
          hint="Set the merchant code from your eSewa account."
          hintPath="backend/.env"
          hintKey="ESEWA_MERCHANT_CODE"
          value={form.esewa_merchant_id}
          onChange={(e) => update("esewa_merchant_id", e.target.value)}
        />

        <Input
          label="eSewa Secret Key"
          hint="Used to sign eSewa payment requests."
          hintPath="backend/.env"
          hintKey="ESEWA_SECRET_KEY"
          value={form.esewa_secret_key}
          onChange={(e) => update("esewa_secret_key", e.target.value)}
        />

        <Input
          label="Khalti Public Key"
          hint="Public key used by the frontend to initiate Khalti payments."
          hintPath="backend/.env"
          hintKey="KHALTI_PUBLIC_KEY"
          value={form.khalti_public_key}
          onChange={(e) => update("khalti_public_key", e.target.value)}
        />

        <Input
          label="Khalti Secret Key"
          hint="Secret key used by the backend for Khalti verification."
          hintPath="backend/.env"
          hintKey="KHALTI_SECRET_KEY"
          value={form.khalti_secret_key}
          onChange={(e) => update("khalti_secret_key", e.target.value)}
        />
      </Section>

      {/* EMAIL SETTINGS */}
      <Section title="Email (SMTP) Settings">
        <Input
          label="SMTP Host"
          hint="SMTP server hostname (e.g., smtp.gmail.com)."
          hintPath="backend/.env"
          hintKey="MAIL_HOST"
          value={form.smtp_host}
          onChange={(e) => update("smtp_host", e.target.value)}
        />
        <Input
          label="SMTP Port"
          hint="Common ports: 587 (TLS) or 465 (SSL)."
          hintPath="backend/.env"
          hintKey="MAIL_PORT"
          value={form.smtp_port}
          type="number"
          onChange={(e) => update("smtp_port", e.target.value)}
        />
        <Input
          label="SMTP Username"
          hint="The SMTP account username or email address."
          hintPath="backend/.env"
          hintKey="MAIL_USERNAME"
          value={form.smtp_username}
          onChange={(e) => update("smtp_username", e.target.value)}
        />
        <Input
          label="SMTP Password"
          hint="Use an app password if your provider requires it."
          hintPath="backend/.env"
          hintKey="MAIL_PASSWORD"
          type="password"
          value={form.smtp_password}
          onChange={(e) => update("smtp_password", e.target.value)}
        />
        <Input
          label='"Mail From" Name'
          hint="Displayed as the sender name in outgoing emails."
          hintPath="backend/.env"
          hintKey="MAIL_FROM_NAME"
          value={form.mail_from_name}
          onChange={(e) => update("mail_from_name", e.target.value)}
        />
        <Input
          label='"Mail From" Email'
          hint="Displayed as the sender address in outgoing emails."
          hintPath="backend/.env"
          hintKey="MAIL_FROM_ADDRESS"
          value={form.mail_from_address}
          onChange={(e) => update("mail_from_address", e.target.value)}
        />
      </Section>

      {/* BRANDING SETTINGS */}
      <Section title="Branding Settings">
        <Input
          label="System Name"
          hint="Shown in admin pages and system emails."
          hintPath="backend/.env"
          hintKey="APP_NAME"
          value={form.system_name}
          onChange={(e) => update("system_name", e.target.value)}
        />
        <Input
          label="Website URL"
          hint="Frontend URL used in emails and redirects."
          hintPath="backend/.env"
          hintKey="APP_FRONTEND_URL"
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
      bg-card-light dark:bg-card-dark rounded-xl border border-border-light
      dark:border-border-dark p-6 shadow-sm space-y-6
    "
  >
    <h2 className="text-lg font-semibold">{title}</h2>
    {children}
  </div>
);

const Input = ({ label, hint, hintPath, hintKey, ...props }) => (
  <div className="space-y-1">
    <label
      className="text-sm font-medium"
      title={hintPath ? `${hintPath}${hintKey ? ` (${hintKey})` : ""}` : ""}
    >
      {label}
    </label>
    {hint && (
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {hint}
      </p>
    )}
    <input
      {...props}
      title={hintPath ? `${hintPath}${hintKey ? ` (${hintKey})` : ""}` : ""}
      className="
        w-full px-4 py-2 rounded-lg border
        bg-card-light dark:bg-card-dark
        border-border-light dark:border-border-dark
        focus:outline-none
      "
    />
  </div>
);

const Select = ({ label, options, hint, hintPath, hintKey, ...props }) => (
  <div className="space-y-1">
    <label
      className="text-sm font-medium"
      title={hintPath ? `${hintPath}${hintKey ? ` (${hintKey})` : ""}` : ""}
    >
      {label}
    </label>
    {hint && (
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {hint}
      </p>
    )}
    <select
      {...props}
      title={hintPath ? `${hintPath}${hintKey ? ` (${hintKey})` : ""}` : ""}
      className="
        w-full px-4 py-2 rounded-lg border
        bg-card-light dark:bg-card-dark
        border-border-light dark:border-border-dark
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
