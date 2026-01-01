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
  const query = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
  const policyId = query.get("policy");

  const token = sessionStorage.getItem("client_token");
  const isClient = !!token;

  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);

  const [kycStatus, setKycStatus] = useState(null);

  const [error, setError] = useState("");
  const [payingEsewa, setPayingEsewa] = useState(false);
  const [payingKhalti, setPayingKhalti] = useState(false);

  const [billingCycle, setBillingCycle] = useState("yearly");
  const [cyclePremium, setCyclePremium] = useState(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
  });

  const fmt = (n) => Number(n || 0).toLocaleString("en-IN");
  const basePremium = policy?.personalized_premium || policy?.premium_amt || 0;

  const computeCycleAmount = (cycle) => {
    switch (cycle) {
      case "monthly":
        return basePremium / 12;
      case "quarterly":
        return basePremium / 4;
      case "half_yearly":
        return basePremium / 2;
      default:
        return basePremium;
    }
  };

  const Row = ({ label, value, highlight }) => (
    <div className="flex justify-between">
      <span className="opacity-70">{label}</span>
      <span
        className={`font-semibold ${
          highlight ? "text-primary-light dark:text-primary-dark" : ""
        }`}
      >
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch policy
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
    if (policyId) load();
  }, [policyId]);

  // Load default billing cycle from settings
  useEffect(() => {
    const loadDefaults = async () => {
      try {
        const res = await API.get("/settings/public");
        const cycle = res.data?.default_billing_cycle;
        if (cycle) {
          setBillingCycle(cycle);
        }
      } catch (err) {
        // ignore - fallback to local default
      }
    };
    loadDefaults();
  }, []);

  // Fetch user + KYC
  useEffect(() => {
    const loadUser = async () => {
      try {
        const me = await API.get("/me");
        const user = me.data;

        const k = await API.get("/kyc/me");
        const list = k.data?.data || [];

        const latest = list.length ? list[0] : null;

        const latestStatus = latest?.status || "not_submitted";
        setKycStatus(latestStatus);

        if (latestStatus === "approved" && latest?.allow_edit) {
          navigate("/client/kyc", { replace: true });
          return;
        }
        if (latestStatus === "rejected" || latestStatus === "not_submitted") {
          navigate("/client/kyc", { replace: true });
          return;
        }

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

  // Preview premium when billing cycle changes
  useEffect(() => {
    const loadPreview = async () => {
      try {
        if (!policyId) return;

        const res = await API.post("/buy/preview", {
          policy_id: Number(policyId),
          billing_cycle: billingCycle,
        });

        setCyclePremium(res.data.cycle_amount ?? computeCycleAmount(billingCycle));
      } catch (err) {
        console.log("Preview error:", err.response?.data || err.message);
        setCyclePremium(computeCycleAmount(billingCycle));
      }
    };

    loadPreview();
  }, [billingCycle, policyId]);

  // eSewa Redirect helper
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

  // Create buy request with billing_cycle
  // Pay via eSewa
  const handlePayNow = async () => {
    if (kycStatus !== "approved") {
      setError("Your KYC must be approved before you can purchase a policy.");
      return;
    }

    setPayingEsewa(true);
    setError("");

    try {
      const payRes = await API.post("/payments/esewa", {
        policy_id: Number(policyId),
        billing_cycle: billingCycle,
        email: form.email.trim() || undefined,
      });

      const { redirect_url, payload } = payRes.data;

      if (redirect_url && payload) {
        postRedirect(redirect_url, payload);
        return;
      }

      setError("Payment could not be started.");
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message;
      setError(msg || "Something went wrong while creating payment.");
    } finally {
      setPayingEsewa(false);
    }
  };

  // Pay via Khalti
  const handlePayKhalti = async () => {
    if (kycStatus !== "approved") {
      setError("Your KYC must be approved before you can purchase a policy.");
      return;
    }

    setPayingKhalti(true);
    setError("");

    try {
      const payRes = await API.post("/payments/khalti", {
        policy_id: Number(policyId),
        billing_cycle: billingCycle,
        email: form.email.trim() || undefined,
      });

      if (payRes.data?.payment_url) {
        window.location.href = payRes.data.payment_url;
        return;
      }

      setError("Payment could not be started.");
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message;
      setError(msg || "Something went wrong while creating payment.");
    } finally {
      setPayingKhalti(false);
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
            {/* YEARLY PREMIUM */}
            <Row
              label="Yearly Premium"
              value={`रु. ${fmt(policy.personalized_premium || policy.premium_amt)}`} 
            />

            {/* CYCLE PREMIUM */}
            {cyclePremium && (
              <Row
                label={`Premium (${billingCycle.replace("_", " ")})`}
                value={`रु. ${fmt(cyclePremium)}`}
                highlight
              />
            )}

            <Row
              label="Coverage Limit"
              value={`रु. ${fmt(policy.coverage_limit)}`}
            />

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
            <tr>
              <label className="text-xs font-semibold">Please provide a  email where you want to receive policy documents and reciepts.</label>
            </tr>
            
            <Input
              label="Email"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
            />
            

            {/* BILLING CYCLE */}
            <div>
              <label className="text-xs font-semibold">Billing Cycle</label>
              <select
                className="
                  w-full mt-1 px-3 py-2 border rounded-lg 
                  bg-white dark:bg-slate-900 
                  border-border-light dark:border-border-dark 
                  text-sm
                "
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value)}
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="half_yearly">Half-Yearly (6 months)</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          {/* ERROR BOX */}
          {error && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* TOTAL PAYING AMOUNT */}
          {cyclePremium && (
            <div className="mt-6 p-4 rounded-xl bg-primary-light/10 dark:bg-primary-dark/20 border border-primary-light/30 dark:border-primary-dark/30">
              <p className="text-sm opacity-70">Total Amount To Pay Now</p>
              <p className="text-2xl font-bold text-primary-light dark:text-primary-dark">
                रु. {fmt(cyclePremium)}
              </p>
              <p className="text-xs opacity-60 mt-1">
                Billing Cycle: {billingCycle.replace("_", " ")}
              </p>
            </div>
          )}

          {/* PAYMENT BUTTONS */}
         <div className="grid gap-5 mt-10 sm:grid-cols-2">

  {/* ==================== eSewa Ultra Premium Button ==================== */}
                <button
                  type="button"
                  disabled={payingEsewa || kycStatus !== "approved"}
                  onClick={handlePayNow}
                  className={`
                    relative group w-full py-3 px-5 rounded-2xl font-semibold overflow-hidden
                    flex items-center justify-center gap-3
                    transition-all duration-300 active:scale-95

                    ${payingEsewa
                      ? "cursor-not-allowed opacity-60"
                      : "cursor-pointer"
                    }
                  `}
                >

                  {/* Gradient Border Layer */}
                  <span className="absolute inset-0 rounded-2xl bg-linear-to-br from-[#3CB043] via-[#49d157] to-[#2f8a37] p-0.5 group-hover:from-[#49d157] group-hover:to-[#3CB043] transition-all duration-500"></span>

                  {/* Inner Glass Card */}
                  <span className="
                    absolute inset-0.5 rounded-2xl 
                    bg-white/10 dark:bg-black/20 
                    backdrop-blur-xl 
                    shadow-[0_8px_20px_rgba(0,0,0,0.3)]
                    group-hover:shadow-[0_12px_28px_rgba(0,0,0,0.45)]
                    transition-all duration-300
                  ">
                    <img
                      src="/esewa.png"
                      alt="eSewa"
                      className="h z-100 opacity-10"
                    />
                  </span>

                  {/* Text */}
                  <span className="relative z-10 text-base tracking-wide text-black dark:text-white">
                    {payingEsewa ? "Processing..." : "Pay via eSewa"}
                  </span>

                  {/* Glow Pulse */}
                  {!payingEsewa && (
                    <span className="
                      absolute inset-0 rounded-2xl
                      bg-[#3CB043]/40 blur-xl opacity-0 
                      group-hover:opacity-50 transition duration-500
                    "></span>
                  )}
                </button>


                {/* ==================== Khalti Ultra Premium Button ==================== */}
                <button
                  type="button"
                  disabled={payingKhalti || kycStatus !== "approved"}
                  onClick={handlePayKhalti}
                  className={`
                    relative group w-full py-3 px-5 rounded-2xl font-semibold overflow-hidden
                    flex items-center justify-center gap-3
                    transition-all duration-300 active:scale-95

                    ${payingKhalti
                      ? "cursor-not-allowed opacity-60"
                      : "cursor-pointer"
                    }
                  `}
                >

                  {/* Gradient Border Layer */}
                  <span className="absolute inset-0 rounded-2xl bg-linear-to-br from-[#8B0000] via-[#a30f0f] to-[#600000] p-0.5 group-hover:from-[#a30f0f] group-hover:to-[#8B0000] transition-all duration-500"></span>

                  {/* Inner Glass Card */}
                  <span className="
                    absolute inset-0.5 rounded-2xl 
                    bg-white/10 dark:bg-black/20 
                    backdrop-blur-xl 
                    shadow-[0_8px_20px_rgba(0,0,0,0.3)]
                    group-hover:shadow-[0_12px_28px_rgba(0,0,0,0.45)]
                    transition-all duration-300
                  ">
                    <img
                      src="/khalti.png"
                      alt="Khalti"
                      className="relative z-10 opacity-10"
                    />
                  </span>

                  {/* Text */}
                  <span className="relative z-10 text-base tracking-wide text-black dark:text-white">
                    {payingKhalti ? "Processing..." : "Pay via Khalti"}
                  </span>

                  {/* Glow Pulse */}
                  {!payingKhalti && (
                    <span className="
                      absolute inset-0 rounded-2xl
                      bg-[#8B0000]/35 blur-xl opacity-0 
                      group-hover:opacity-50 transition duration-500
                    "></span>
                  )}
                </button>


</div>

        </div>
      </div>
    </div>
  );
};

export default BuyRequest;
