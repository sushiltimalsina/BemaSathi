import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../../../api/api";
import {
  ShieldCheckIcon,
  StarIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

const BuyRequest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const policyId = query.get("policy");

  const token = localStorage.getItem("client_token");
  const isClient = !!token;

  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);

  const [kycData, setKycData] = useState(null);
  const [kycStatus, setKycStatus] = useState(null);

  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
  });

  const fmt = (n) => Number(n || 0).toLocaleString("en-IN");
  
  const Row = ({ label, value, highlight }) => (
    <div className="flex justify-between">
      <span className="opacity-70">{label}</span>
      <span className={`font-semibold ${highlight ? "text-primary-light dark:text-primary-dark" : ""}`}>
        {value}
      </span>
    </div>
  );
  
  const Input = ({ label, value, onChange }) => (
    <div>
      <label className="text-xs font-semibold">{label}</label>
      <input
        className="
          w-full mt-1 px-3 py-2 border rounded-lg 
          bg-white dark:bg-slate-900 
          border-border-light dark:border-border-dark 
          text-sm
        "
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
  
    // FORCE LOGIN
  useEffect(() => {
    if (!isClient) {
      const redirect = encodeURIComponent(location.pathname + location.search);
      navigate(`/login?redirect=${redirect}`);
    }
  }, []);

  // FETCH POLICY
  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get(`/policies/${policyId}`);
        setPolicy(res.data);
      } catch {
        setError("Policy not found.");
      }
      setLoading(false);
    };
    load();
  }, [policyId]);

  // FETCH USER & KYC
  useEffect(() => {
    const loadUser = async () => {
      try {
        const me = await API.get("/me");
        const user = me.data;

        const res = await API.get("/kyc/me");
        const list = res.data?.data || [];

        const latest = list.length ? list[0] : null;

        setKycStatus(latest?.status || "not_submitted");
        setKycData(latest);

        setForm({
          name: latest?.full_name || user.name || "",
          phone: latest?.phone || user.phone || "",
          email: user.email || "",
        });
      } catch (err) {
        console.log(err);
      }
    };

    loadUser();
  }, []);

  // REDIRECT HANDLER FOR ESEWA
  const postRedirect = (url, payload = {}) => {
    const f = document.createElement("form");
    f.method = "POST";
    f.action = url;
    f.target = "_self";

    Object.entries(payload).forEach(([k, v]) => {
      const i = document.createElement("input");
      i.type = "hidden";
      i.name = k;
      i.value = v;
      f.appendChild(i);
    });

    document.body.appendChild(f);
    f.submit();
    f.remove();
  };

  // AUTO SUBMIT + PAY
  const handlePayNow = async () => {
    if (kycStatus !== "approved") {
      setError("Your KYC must be approved before you can purchase a policy.");
      return;
    }

    setPaying(true);
    setError("");

    try {
      // STEP 1 → Create BuyRequest automatically
      const res = await API.post("/buy", {
        policy_id: Number(policyId),
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
      });

      const buy_request_id =
        res.data?.buy_request_id ||
        res.data?.data?.id ||
        res.data?.buy_request?.id;

      if (!buy_request_id) {
        setError(res.data?.message || "Could not create request.");
        setPaying(false);
        return;
      }

      // STEP 2 → INITIATE ESEWA PAYMENT
      const payRes = await API.post("/payments/esewa", {
        buy_request_id,
      });

      const { redirect_url, payload } = payRes.data;

      if (redirect_url && payload) {
        postRedirect(redirect_url, payload);
        return;
      }

      setError("Payment could not be started.");
    } catch (err) {
      const msg = err?.response?.data?.message;
      setError(msg || "Something went wrong while creating payment.");
    } finally {
      setPaying(false);
    }
  };

  if (loading)
    return <p className="text-center mt-20 opacity-75">Loading...</p>;

  if (!policy)
    return <p className="text-center mt-20 text-red-500">{error}</p>;

  return (
    <div
      className="
        min-h-screen px-6 py-10 max-w-5xl mx-auto
        text-text-light dark:text-text-dark
        bg-background-light dark:bg-background-dark
        transition
      "
    >
      {/* BACK BUTTON */}
      <button
        onClick={() => navigate(-1)}
        className="
          flex items-center gap-2 mb-6
          hover:text-primary-light dark:hover:text-primary-dark
        "
      >
        <ArrowLeftIcon className="w-5 h-5" /> Back
      </button>

      <h1 className="text-3xl font-bold mb-6">Buy Insurance Policy</h1>

      <div className="grid md:grid-cols-2 gap-8">

        {/* POLICY CARD */}
        <div
          className="
            p-6 rounded-2xl shadow-md 
            border border-border-light dark:border-border-dark
            bg-card-light dark:bg-card-dark
          "
        >
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheckIcon className="w-7 h-7 text-primary-light dark:text-primary-dark" />
            <h2 className="text-xl font-bold">{policy.policy_name}</h2>
          </div>

          <p className="text-xs opacity-70">{policy.company_name}</p>

          <span
            className="
              inline-block px-3 py-1 text-xs mt-3 rounded-full 
              bg-primary-light/10 dark:bg-primary-dark/20
              text-primary-light dark:text-primary-dark
              border border-primary-light/30 dark:border-primary-dark/30
            "
          >
            {policy.insurance_type.toUpperCase()}
          </span>

          <p className="text-sm mt-4 opacity-80">{policy.policy_description}</p>

          <div className="mt-6 space-y-3 text-sm">
            <Row label="Base Premium" value={`Rs. ${fmt(policy.premium_amt)}`} />

            {policy.personalized_premium && (
              <Row
                label="Your Premium"
                value={`Rs. ${fmt(policy.personalized_premium)}`}
                highlight
              />
            )}

            <Row label="Coverage Limit" value={`Rs. ${fmt(policy.coverage_limit)}`} />

            {policy.company_rating && (
              <Row
                label="Company Rating"
                value={
                  <span className="flex items-center gap-1">
                    <StarIcon className="w-4 h-4 text-yellow-500" />
                    {policy.company_rating}
                  </span>
                }
              />
            )}
          </div>
        </div>

        {/* USER FORM */}
        <div
          className="
            p-6 rounded-2xl shadow-md 
            border border-border-light dark:border-border-dark
            bg-card-light dark:bg-card-dark
          "
        >
          <h3 className="text-lg font-bold mb-4">Your Details</h3>

          {/* ===================== KYC WARNING / UPDATE BOX ===================== */}

          <div className="space-y-4">
            <Input
              label="Full Name"
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
            />
            <Input
              label="Phone Number"
              value={form.phone}
              onChange={(v) => setForm({ ...form, phone: v })}
            />
            <Input
              label="Email"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
            />
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

<button
  type="button"
  disabled={paying || kycStatus !== "approved"}
  onClick={handlePayNow}
  className="
    w-full mt-6 px-4 py-3 rounded-lg font-semibold
    shadow-sm disabled:opacity-60 disabled:cursor-not-allowed
    transition-all
  "
  style={{
    backgroundColor:
      paying || kycStatus !== "approved" ? "#4CAF50AA" : "#4CAF50",
    color: "#ffffff",
    transition: "0.2s",
    border: "none",
  }}
  onMouseEnter={(e) => {
    if (!paying && kycStatus === "approved") {
      e.target.style.backgroundColor = "#43A047"; // hover leaf green
    }
  }}
  onMouseLeave={(e) => {
    if (!paying && kycStatus === "approved") {
      e.target.style.backgroundColor = "#4CAF50"; // normal leaf green
    }
  }}
>
  {paying ? "Redirecting..." : "Pay via eSewa"}
</button>

        </div>
      </div>
    </div>
  );
};

export default BuyRequest;
