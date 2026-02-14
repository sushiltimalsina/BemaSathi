import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../../../api/api";
import {
  UserCircleIcon,
  HeartIcon,
  SparklesIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  MapPinIcon,
  PhoneIcon,
  PencilSquareIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import { nepalData } from "../../../data/nepal_address";

const BUDGET_RANGES = ["< 5k/yr", "5k-10k", "10k-20k", "20k-50k", "50k+"];
const MEDICAL_CONDITIONS = [
  { id: "diabetes", label: "Diabetes" },
  { id: "heart", label: "Heart Issues" },
  { id: "hypertension", label: "Hypertension" },
  { id: "asthma", label: "Asthma" },
];

const MyProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectMsg = location.state?.msg || "";
  const returnTo = location.state?.returnTo || "";
  const [form, setForm] = useState(() => {
    const cached = sessionStorage.getItem("client_user");
    const data = cached ? JSON.parse(cached) : {};
    return {
      name: data.name || "",
      email: data.email || "",
      dob: data.dob || "",
      phone: data.phone || "",
      address: data.address || "",
      weight_kg: data.weight_kg || "",
      height_cm: data.height_cm || "",
      occupation_class: data.occupation_class || "class_1",
      is_smoker: !!data.is_smoker,
      budget_range: data.budget_range || "10k-20k",
      coverage_type: data.coverage_type || "individual",
      family_members: data.family_members || 1,
      pre_existing_conditions: Array.isArray(data.pre_existing_conditions)
        ? data.pre_existing_conditions
        : [],
      family_member_details: Array.isArray(data.family_member_details)
        ? data.family_member_details
        : [],
      province: data.province || "",
      district: data.district || "",
      municipality_type: data.municipality_type || "metropolitan",
      municipality_name: data.municipality_name || "",
      ward_number: data.ward_number || "",
      street_address: data.street_address || "",
      region_type: data.region_type || "urban",
    };
  });

  const [loading, setLoading] = useState(!sessionStorage.getItem("client_user"));
  const [updating, setUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [bmi, setBmi] = useState(null);
  const [insights, setInsights] = useState({
    loading: 0,
    matchScore: 0,
    riskLevel: "Low",
    riskColor: "text-green-500"
  });
  const [kycStatus, setKycStatus] = useState("loading");
  const [retryCount, setRetryCount] = useState(0);

  // Load user data with retry logic
  useEffect(() => {
    const loadUserData = async (attempt = 1) => {
      try {
        const token = sessionStorage.getItem("client_token") || localStorage.getItem("token");
        if (!token) {
          if (attempt < 3) {
            setTimeout(() => loadUserData(attempt + 1), 300);
            return;
          }
          throw new Error("Authentication token not found");
        }

        const [userRes, kycRes] = await Promise.all([
          API.get("/me"),
          API.get("/kyc/me").catch(() => ({ data: { data: [] } }))
        ]);

        const data = userRes.data || {};
        const kycList = kycRes.data?.data || [];
        const latestKyc = kycList[0];

        setKycStatus(latestKyc?.status || "not_submitted");

        setForm(prev => ({
          ...prev,
          name: data.name || "",
          email: data.email || "",
          dob: data.dob || "",
          phone: data.phone || "",
          address: data.address || "",
          weight_kg: data.weight_kg || "",
          height_cm: data.height_cm || "",
          occupation_class: data.occupation_class || "class_1",
          is_smoker: !!data.is_smoker,
          budget_range: data.budget_range || "10k-20k",
          coverage_type: data.coverage_type || "individual",
          family_members: data.family_members || 1,
          pre_existing_conditions: Array.isArray(data.pre_existing_conditions)
            ? data.pre_existing_conditions
            : [],
          family_member_details: Array.isArray(data.family_member_details)
            ? data.family_member_details
            : [],
          province: data.province || "",
          district: data.district || "",
          municipality_type: data.municipality_type || "metropolitan",
          municipality_name: data.municipality_name || "",
          ward_number: data.ward_number || "",
          street_address: data.street_address || "",
          region_type: data.region_type || "urban",
        }));

        const isComplete =
          data.dob &&
          data.phone &&
          data.address &&
          data.weight_kg &&
          data.height_cm;

        setIsEditing(!isComplete);
        setError("");
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch profile data:", err);

        if (attempt < 3 && (err.response?.status === 401 || !err.response)) {
          setTimeout(() => loadUserData(attempt + 1), 500);
          return;
        }

        if (err.response?.status === 401 || err.response?.status === 403) {
          setError("Session expired. Please log in again.");
          setTimeout(() => {
            localStorage.removeItem("token");
            sessionStorage.removeItem("client_token");
            sessionStorage.removeItem("client_user");
            window.location.href = "/login";
          }, 1500);
        } else {
          setError("Failed to load profile. Please refresh the page.");
        }
        setLoading(false);
      }
    };

    // Small delay to ensure auth state is ready
    const timer = setTimeout(() => loadUserData(), 100);
    return () => clearTimeout(timer);
  }, [retryCount]);

  // Sync Family Array
  useEffect(() => {
    if (form.coverage_type === "family") {
      const count = parseInt(form.family_members) || 1;
      setForm((prev) => {
        const current = prev.family_member_details || [];
        if (current.length === count) return prev;

        // Resize: ensure index 0 exists (Self placeholder) + dependents
        const newDetails = Array.from({ length: count }, (_, i) => {
          // Start with existing, or default. Index 0 is Self (placeholder)
          if (current[i]) return current[i];
          return { name: "", relation: "Spouse", dob: "", is_smoker: false };
        });

        // Keep index 0 as placeholder if empty
        if (!newDetails[0]) newDetails[0] = { name: "Self", relation: "Self", dob: "", is_smoker: false };

        return { ...prev, family_member_details: newDetails };
      });
    }
  }, [form.family_members, form.coverage_type]);

  // Calculate BMI & Insights
  useEffect(() => {
    let currentBmi = null;
    if (form.weight_kg && form.height_cm) {
      const h = form.height_cm / 100;
      currentBmi = (form.weight_kg / (h * h)).toFixed(1);
      setBmi(currentBmi);
    } else {
      setBmi(null);
    }

    // Real-time Recommendation Logic Simulation
    let premiumLoading = 0;
    let score = 95;

    if (currentBmi) {
      const v = parseFloat(currentBmi);
      if (v >= 25 && v < 30) premiumLoading += 10;
      else if (v >= 30) premiumLoading += 30;
    }
    if (form.is_smoker) { premiumLoading += 40; score -= 15; }
    if (form.occupation_class === "class_2") premiumLoading += 15;
    else if (form.occupation_class === "class_3") premiumLoading += 40;

    const conditionCount = form.pre_existing_conditions.length;
    premiumLoading += conditionCount * 25;
    score -= conditionCount * 10;

    if (form.dob) {
      const age = new Date().getFullYear() - new Date(form.dob).getFullYear();
      if (age > 45) { premiumLoading += (age - 45) * 2; score -= 5; }
    }

    let risk = "Low";
    let color = "text-green-500";
    if (premiumLoading > 50) { risk = "High"; color = "text-red-500"; }
    else if (premiumLoading > 20) { risk = "Moderate"; color = "text-amber-500"; }

    setInsights({
      loading: premiumLoading,
      matchScore: Math.max(score, 40),
      riskLevel: risk,
      riskColor: color
    });

  }, [form]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError("");
    setSuccess("");

    try {
      await API.put("/user/profile", form);
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Redirect back if coming from purchase flow
      if (returnTo) {
        setTimeout(() => {
          navigate(returnTo);
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  const clearStateMessage = () => {
    navigate(location.pathname, { replace: true, state: {} });
  };

  const getBmiStatus = (val) => {
    const v = parseFloat(val);
    if (v < 18.5) return { label: "Underweight", color: "text-blue-500" };
    if (v < 25) return { label: "Healthy", color: "text-green-500" };
    if (v < 30) return { label: "Overweight", color: "text-yellow-500" };
    return { label: "Obese", color: "text-red-500" };
  };

  // Loading State
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary-light/20 border-t-primary-light rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-bold opacity-60">Loading your profile...</p>
      </div>
    </div>
  );

  // Error State with Retry
  if (error && !form.email) return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
          <ExclamationTriangleIcon className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-black mb-3 text-text-light dark:text-text-dark">Unable to Load Profile</h2>
        <p className="text-sm opacity-70 mb-6">{error}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => {
              setError("");
              setLoading(true);
              setRetryCount(prev => prev + 1);
            }}
            className="px-6 py-3 rounded-2xl bg-primary-light text-white font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary-light/30"
          >
            <ArrowPathIcon className="w-5 h-5 inline mr-2" />
            Retry
          </button>
          <button
            onClick={() => window.location.href = "/client/dashboard"}
            className="px-6 py-3 rounded-2xl border-2 border-border-light dark:border-border-dark font-bold hover:border-primary-light/50 transition-all"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-20 pb-12 px-5 bg-background-light dark:bg-background-dark transition-colors duration-500">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 mb-6 rounded-3xl bg-primary-light/10 dark:bg-primary-dark/10 ring-1 ring-primary-light/20">
            <UserCircleIcon className="w-8 h-8 text-primary-light dark:text-primary-dark animate-pulse" />
          </div>
          <div className="flex flex-col items-center justify-center gap-4 mb-2">
            <h1 className="text-4xl font-black tracking-tight text-text-light dark:text-text-dark">
              Account Settings & Optimization
            </h1>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest border transition-all ${isEditing
                ? "bg-primary-light text-white border-primary-light shadow-lg shadow-primary-light/30"
                : "bg-transparent text-text-light dark:text-text-dark border-border-light dark:border-border-dark hover:bg-black/5 dark:hover:bg-white/5"
                }`}
            >
              {isEditing ? (
                <>
                  <CheckCircleIcon className="w-4 h-4" /> Editing Enabled
                </>
              ) : (
                <>
                  <PencilSquareIcon className="w-4 h-4" /> Edit Profile
                </>
              )}
            </button>
          </div>
          <p className="text-sm opacity-60 mt-3 max-w-xl mx-auto leading-relaxed">
            Fine-tune your personal data to ensure your <span className="text-primary-light dark:text-primary-dark font-bold font-mono">Insurance Matrix</span> remains accurate and your premiums stay optimized.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-600 text-sm p-4 rounded-xl mb-6 text-center animate-in shake duration-500">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-600 text-sm p-4 rounded-xl mb-6 text-center animate-in slide-in-from-top duration-500">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT COLUMN: IDENTITY & LIFESTYLE */}
          <div className="lg:col-span-8 space-y-6">

            {/* SECTION 1: IDENTITY */}
            <div className="bg-card-light dark:bg-card-dark rounded-[2.5rem] p-8 shadow-2xl shadow-black/5 border border-border-light dark:border-border-dark group transition-all duration-300 hover:shadow-primary-light/5">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-8 flex items-center gap-3">
                <span className="w-8 h-px bg-current opacity-20"></span>
                <ShieldCheckIcon className="w-4 h-4" /> Identity & Contact
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block ml-1 flex items-center gap-1.5">
                    Full Name
                    {kycStatus === 'approved' && <ShieldCheckIcon className="w-3 h-3 text-green-500" />}
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    disabled={!isEditing || kycStatus === 'approved'}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-5 py-4 text-sm rounded-2xl bg-background-light dark:bg-card-dark/50 border border-border-light dark:border-border-dark focus:ring-4 focus:ring-primary-light/10 focus:border-primary-light transition-all outline-none font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                  {kycStatus === 'approved' && (
                    <p className="text-[9px] text-green-600 dark:text-green-400 font-bold ml-1 uppercase tracking-tighter">
                      Verified Identity (Locked)
                    </p>
                  )}
                </div>
                <div className="space-y-2 opacity-60 cursor-not-allowed">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block ml-1">Email Address (Locked)</label>
                  <input
                    type="email"
                    value={form.email}
                    disabled
                    className="w-full px-5 py-4 text-sm rounded-2xl bg-black/5 dark:bg-white/5 border border-border-light dark:border-border-dark outline-none italic"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block ml-1 flex items-center gap-1.5">
                    <PhoneIcon className="w-3 h-3" /> Phone Number
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    disabled={!isEditing}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-5 py-4 text-sm rounded-2xl bg-background-light dark:bg-card-dark/50 border border-border-light dark:border-border-dark focus:ring-4 focus:ring-primary-light/10 focus:border-primary-light transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30 rounded-xl p-3 flex items-start gap-3 mb-2">
                    <div className="p-1.5 bg-amber-100 dark:bg-amber-800/30 rounded-lg text-amber-600 dark:text-amber-400">
                      <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-[10px] leading-relaxed">
                      <p className="font-bold text-amber-900 dark:text-amber-200 uppercase tracking-tighter mb-0.5">Current Residency Recommendation</p>
                      <p className="text-amber-800/70 dark:text-amber-400/60 font-medium">Please select the address where you are <span className="text-amber-900 dark:text-amber-200 font-bold underline">living right now</span>. This ensures we apply the correct regional loading and provide you with an accurate premium quote based on your actual location.</p>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block ml-1 flex items-center gap-1.5">
                      Province
                    </label>
                    <select
                      value={form.province}
                      disabled={!isEditing}
                      onChange={(e) => setForm({ ...form, province: e.target.value, district: "" })}
                      className="w-full px-5 py-4 text-sm rounded-2xl bg-background-light dark:bg-card-dark/50 border border-border-light dark:border-border-dark focus:ring-4 focus:ring-primary-light/10 focus:border-primary-light transition-all outline-none font-bold disabled:opacity-50"
                      required
                    >
                      <option value="">Select Province</option>
                      {nepalData.provinces.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block ml-1 flex items-center gap-1.5">
                      District
                    </label>
                    <select
                      value={form.district}
                      disabled={!isEditing || !form.province}
                      onChange={(e) => setForm({ ...form, district: e.target.value, municipality_name: "", municipality_type: "", region_type: "" })}
                      className="w-full px-5 py-4 text-sm rounded-2xl bg-background-light dark:bg-card-dark/50 border border-border-light dark:border-border-dark focus:ring-4 focus:ring-primary-light/10 focus:border-primary-light transition-all outline-none font-bold disabled:opacity-50"
                      required
                    >
                      <option value="">Select District</option>
                      {form.province && nepalData.provinces.find(p => p.name === form.province)?.districts.map(d => (
                        <option key={d.name} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block ml-1 flex items-center gap-1.5">
                      Municipality / Local Level
                    </label>
                    <select
                      value={form.municipality_name}
                      disabled={!isEditing || !form.district}
                      onChange={(e) => {
                        const district = nepalData.provinces
                          .find(p => p.name === form.province)?.districts
                          .find(d => d.name === form.district);
                        const muni = district?.municipalities.find(m => m.name === e.target.value);

                        if (muni) {
                          const typeData = nepalData.municipalityTypes.find(t => t.value === muni.type);
                          setForm({
                            ...form,
                            municipality_name: e.target.value,
                            municipality_type: muni.type,
                            region_type: typeData?.region || "urban"
                          });
                        }
                      }}
                      className="w-full px-5 py-4 text-sm rounded-2xl bg-background-light dark:bg-card-dark/50 border border-border-light dark:border-border-dark focus:ring-4 focus:ring-primary-light/10 focus:border-primary-light transition-all outline-none font-bold disabled:opacity-50"
                      required
                    >
                      <option value="">Select Municipality</option>
                      {form.district && nepalData.provinces
                        .find(p => p.name === form.province)?.districts
                        .find(d => d.name === form.district)?.municipalities.map(m => (
                          <option key={m.name} value={m.name}>{m.name} ({m.type.replace('_', ' ')})</option>
                        ))}
                    </select>
                    {form.region_type && (
                      <p className="text-[9px] font-bold uppercase tracking-tighter ml-1">
                        Categorized as: <span className="text-primary-light dark:text-primary-dark">{form.region_type.replace('_', ' ')}</span>
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block ml-1 flex items-center gap-1.5 opacity-50">
                      Municipality Type (Auto)
                    </label>
                    <input
                      type="text"
                      value={form.municipality_type?.replace('_', ' ')}
                      disabled
                      className="w-full px-5 py-4 text-sm rounded-2xl bg-black/5 dark:bg-white/5 border border-border-light dark:border-border-dark outline-none font-bold italic"
                      placeholder="Auto-calculated"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block ml-1 flex items-center gap-1.5">
                      Ward Number
                    </label>
                    <input
                      type="text"
                      value={form.ward_number}
                      disabled={!isEditing}
                      onChange={(e) => setForm({ ...form, ward_number: e.target.value })}
                      className="w-full px-5 py-4 text-sm rounded-2xl bg-background-light dark:bg-card-dark/50 border border-border-light dark:border-border-dark focus:ring-4 focus:ring-primary-light/10 focus:border-primary-light transition-all outline-none font-bold disabled:opacity-50"
                      placeholder="e.g. 3"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block ml-1 flex items-center gap-1.5">
                      Street Address / Tole
                    </label>
                    <input
                      type="text"
                      value={form.street_address}
                      disabled={!isEditing}
                      onChange={(e) => setForm({ ...form, street_address: e.target.value })}
                      className="w-full px-5 py-4 text-sm rounded-2xl bg-background-light dark:bg-card-dark/50 border border-border-light dark:border-border-dark focus:ring-4 focus:ring-primary-light/10 focus:border-primary-light transition-all outline-none font-bold disabled:opacity-50"
                      placeholder="e.g. Maharajgunj"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: HEALTH BASICS */}
            <div className="bg-card-light dark:bg-card-dark rounded-[2.5rem] p-8 shadow-2xl shadow-black/5 border border-border-light dark:border-border-dark group transition-all duration-300 hover:shadow-primary-light/5">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-8 flex items-center gap-3">
                <span className="w-8 h-px bg-current opacity-20"></span>
                <HeartIcon className="w-4 h-4" /> Health Metrics
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block ml-1 flex items-center gap-1.5">
                    Date of Birth
                    {kycStatus === 'approved' && <ShieldCheckIcon className="w-3 h-3 text-green-500" />}
                  </label>
                  <input
                    type="date"
                    value={form.dob}
                    disabled={!isEditing || kycStatus === 'approved'}
                    onChange={(e) => setForm({ ...form, dob: e.target.value })}
                    className="w-full px-5 py-4 text-sm rounded-2xl bg-background-light dark:bg-card-dark/50 border border-border-light dark:border-border-dark focus:ring-4 focus:ring-primary-light/10 focus:border-primary-light transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                  {kycStatus === 'approved' && (
                    <p className="text-[9px] text-green-600 dark:text-green-400 font-bold ml-1 uppercase tracking-tighter">
                      Verified via KYC (Locked)
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block ml-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.weight_kg}
                    disabled={!isEditing}
                    onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
                    className="w-full px-5 py-4 text-sm rounded-2xl bg-background-light dark:bg-card-dark/50 border border-border-light dark:border-border-dark focus:ring-4 focus:ring-primary-light/10 focus:border-primary-light transition-all outline-none font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block ml-1">Height (cm)</label>
                  <input
                    type="number"
                    value={form.height_cm}
                    disabled={!isEditing}
                    onChange={(e) => setForm({ ...form, height_cm: e.target.value })}
                    className="w-full px-5 py-4 text-sm rounded-2xl bg-background-light dark:bg-card-dark/50 border border-border-light dark:border-border-dark focus:ring-4 focus:ring-primary-light/10 focus:border-primary-light transition-all outline-none font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                </div>
              </div>

              {bmi && (
                <div className="mt-10 p-6 rounded-3xl bg-gradient-to-r from-primary-light/5 to-transparent border border-primary-light/10 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-card-dark flex items-center justify-center shadow-lg border border-border-light dark:border-border-dark">
                      <span className={`text-2xl font-black ${getBmiStatus(bmi).color}`}>{bmi}</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase opacity-40 tracking-widest mb-1">Current BMI Profile</p>
                      <p className={`text-xl font-black ${getBmiStatus(bmi).color} tracking-tight`}>
                        {getBmiStatus(bmi).label}
                      </p>
                    </div>
                  </div>
                  <div className="text-right hidden md:block">
                    <p className="text-xs font-bold opacity-60 italic">Live Calibration Active</p>
                    <p className="text-[9px] opacity-40 uppercase font-black tracking-widest mt-1">Standardized Indexing</p>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 3: LIFESTYLE & BUDGET */}
            <div className="bg-card-light dark:bg-card-dark rounded-[2.5rem] p-8 shadow-2xl shadow-black/5 border border-border-light dark:border-border-dark group transition-all duration-300 hover:shadow-primary-light/5">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-8 flex items-center gap-3">
                <span className="w-8 h-px bg-current opacity-20"></span>
                <ArrowPathIcon className="w-4 h-4" /> Lifestyle Parameters
              </h2>

              <div className="space-y-10">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-6 ml-1">Coverage Scope</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="flex bg-background-light dark:bg-card-dark/50 p-1.5 rounded-[1.5rem] border border-border-light dark:border-border-dark ring-1 ring-black/5">
                      <button
                        type="button"
                        disabled={!isEditing}
                        onClick={() => setForm({ ...form, coverage_type: "individual", family_members: 1 })}
                        className={`flex-1 py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${form.coverage_type === 'individual' ? 'bg-white dark:bg-primary-dark text-primary-light dark:text-white shadow-xl scale-[1.02]' : 'opacity-40 hover:opacity-100'} disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:opacity-30`}
                      >
                        Individual
                      </button>
                      <button
                        type="button"
                        disabled={!isEditing}
                        onClick={() => setForm({ ...form, coverage_type: "family", family_members: Math.max(2, form.family_members) })}
                        className={`flex-1 py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${form.coverage_type === 'family' ? 'bg-white dark:bg-primary-dark text-primary-light dark:text-white shadow-xl scale-[1.02]' : 'opacity-40 hover:opacity-100'} disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:opacity-30`}
                      >
                        Family Plan
                      </button>
                    </div>

                    {form.coverage_type === "family" && (
                      <div className="animate-in slide-in-from-left duration-300">
                        <div className="relative group">
                          <label className="text-[9px] font-black uppercase tracking-widest opacity-40 absolute -top-5 left-1 group-focus-within:text-primary-light transition-colors">Total Members</label>
                          <div className="relative">
                            <UserCircleIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
                            <input
                              type="number"
                              min="2"
                              max="10"
                              value={form.family_members}
                              disabled={!isEditing}
                              onChange={(e) => setForm({ ...form, family_members: e.target.value === "" ? "" : parseInt(e.target.value) })}
                              className="w-full pl-12 pr-5 py-4 text-sm rounded-2xl bg-background-light dark:bg-card-dark/50 border border-border-light dark:border-border-dark focus:ring-4 focus:ring-primary-light/10 focus:border-primary-light transition-all outline-none font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-6 ml-1">Occupation Hazard Class</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { id: "class_1", label: "Level 1: Low", desc: "Clerical / Admin" },
                      { id: "class_2", label: "Level 2: Med", desc: "Supervisory / Outdoor" },
                      { id: "class_3", label: "Level 3: High", desc: "Manual / Industrial" },
                    ].map(occ => (
                      <button
                        key={occ.id}
                        type="button"
                        disabled={!isEditing}
                        onClick={() => setForm({ ...form, occupation_class: occ.id })}
                        className={`p-6 rounded-[2rem] border text-left transition-all ${form.occupation_class === occ.id
                          ? 'border-primary-light bg-primary-light/10 ring-4 ring-primary-light/5'
                          : 'border-border-light dark:border-border-dark opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5'} disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:opacity-30 disabled:hover:bg-transparent`}
                      >
                        <p className="text-sm font-black mb-1">{occ.label}</p>
                        <p className="text-[10px] opacity-50 font-bold uppercase tracking-tight">{occ.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-6 ml-1">
                      {form.coverage_type === 'family' ? 'Household Smoking Habit' : 'Smoking Habit'}
                    </label>
                    <div className="flex bg-background-light dark:bg-card-dark/50 p-1.5 rounded-[1.5rem] border border-border-light dark:border-border-dark ring-1 ring-black/5">
                      <button
                        type="button"
                        disabled={!isEditing}
                        onClick={() => setForm({ ...form, is_smoker: false })}
                        className={`flex-1 py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${!form.is_smoker ? 'bg-white dark:bg-primary-dark text-primary-light dark:text-white shadow-xl scale-[1.02]' : 'opacity-40 hover:opacity-100'} disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:opacity-30`}
                      >
                        {form.coverage_type === 'family' ? 'Non-Smoker' : 'Non-Smoker'}
                      </button>
                      <button
                        type="button"
                        disabled={!isEditing}
                        onClick={() => setForm({ ...form, is_smoker: true })}
                        className={`flex-1 py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${form.is_smoker ? 'bg-red-500 text-white shadow-xl scale-[1.02]' : 'opacity-40 hover:opacity-100'} disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:opacity-30`}
                      >
                        {form.coverage_type === 'family' ? 'Smoker' : 'Smoker'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-6 ml-1">Annual Budget Target</label>
                    <div className="flex flex-wrap gap-2">
                      {BUDGET_RANGES.map(br => (
                        <button
                          key={br}
                          type="button"
                          disabled={!isEditing}
                          onClick={() => setForm({ ...form, budget_range: br })}
                          className={`px-4 py-3 rounded-2xl text-[10px] font-black border transition-all ${form.budget_range === br
                            ? 'border-primary-light bg-primary-light text-white shadow-lg scale-105'
                            : 'border-border-light dark:border-border-dark opacity-60 hover:opacity-100 hover:border-primary-light/40'} disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:opacity-30`}
                        >
                          {br}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 4: DEPENDENT PROFILES */}
            {form.coverage_type === "family" && (
              <div className="bg-card-light dark:bg-card-dark rounded-[2.5rem] p-8 shadow-2xl shadow-black/5 border border-border-light dark:border-border-dark group transition-all duration-300 hover:shadow-primary-light/5 animate-in slide-in-from-bottom-4 duration-500 mt-8">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-8 flex items-center gap-3">
                  <span className="w-8 h-px bg-current opacity-20"></span>
                  <UserCircleIcon className="w-4 h-4" /> Dependent Profiles
                </h2>

                <div className="space-y-6">
                  {(form.family_member_details || []).slice(1).map((member, idx) => (
                    <div key={idx} className="bg-background-light dark:bg-white/5 p-6 rounded-3xl border border-border-light dark:border-border-dark/30">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-black uppercase tracking-widest opacity-60">Member {idx + 1}</span>
                        <button
                          type="button"
                          disabled={!isEditing || updating}
                          onClick={() => {
                            const updated = [...(form.family_member_details || [])];
                            if (!updated[idx + 1]) updated[idx + 1] = { name: "", relation: "Spouse", dob: "", is_smoker: false };
                            updated[idx + 1] = { ...updated[idx + 1], is_smoker: !updated[idx + 1].is_smoker };
                            setForm({ ...form, family_member_details: updated });
                          }}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${member.is_smoker ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'} disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {member.is_smoker ? 'Smoker' : 'Non-Smoker'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold opacity-40 uppercase">Name</label>
                          <input
                            type="text"
                            value={member.name || ""}
                            disabled={!isEditing}
                            onChange={(e) => {
                              const updated = [...(form.family_member_details || [])];
                              if (!updated[idx + 1]) updated[idx + 1] = { name: "", relation: "Spouse", dob: "", is_smoker: false };
                              updated[idx + 1] = { ...updated[idx + 1], name: e.target.value };
                              setForm({ ...form, family_member_details: updated });
                            }}
                            className="w-full bg-transparent border-b border-border-light dark:border-white/10 py-2 text-sm font-bold outline-none focus:border-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            placeholder="Full Name"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold opacity-40 uppercase">Relation</label>
                          <select
                            value={member.relation || "Spouse"}
                            disabled={!isEditing}
                            onChange={(e) => {
                              const updated = [...(form.family_member_details || [])];
                              if (!updated[idx + 1]) updated[idx + 1] = { name: "", relation: "Spouse", dob: "", is_smoker: false };
                              updated[idx + 1] = { ...updated[idx + 1], relation: e.target.value };
                              setForm({ ...form, family_member_details: updated });
                            }}
                            className="w-full bg-transparent border-b border-border-light dark:border-white/10 py-2 text-sm font-bold outline-none focus:border-primary-light transition-colors [&>option]:bg-card-light [&>option]:dark:bg-card-dark disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {['Spouse', 'Son', 'Daughter', 'Father', 'Mother'].map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold opacity-40 uppercase">DOB</label>
                          <input
                            type="date"
                            value={member.dob || ""}
                            disabled={!isEditing}
                            onChange={(e) => {
                              const updated = [...(form.family_member_details || [])];
                              if (!updated[idx + 1]) updated[idx + 1] = { name: "", relation: "Spouse", dob: "", is_smoker: false };
                              updated[idx + 1] = { ...updated[idx + 1], dob: e.target.value };
                              setForm({ ...form, family_member_details: updated });
                            }}
                            className="w-full bg-transparent border-b border-border-light dark:border-white/10 py-2 text-sm font-bold outline-none focus:border-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-border-light dark:border-white/5">
                        <label className="text-[9px] font-bold opacity-40 uppercase block mb-2">Medical Conditions</label>
                        <div className="flex flex-wrap gap-2">
                          {MEDICAL_CONDITIONS.map(cond => {
                            const isSelected = (member.pre_existing_conditions || []).includes(cond.id);
                            return (
                              <button
                                key={cond.id}
                                type="button"
                                disabled={!isEditing || updating}
                                onClick={() => {
                                  const updated = [...(form.family_member_details || [])];
                                  if (!updated[idx + 1]) updated[idx + 1] = { name: "", relation: "Spouse", dob: "", is_smoker: false };
                                  const currentConditions = updated[idx + 1].pre_existing_conditions || [];

                                  if (isSelected) {
                                    updated[idx + 1] = {
                                      ...updated[idx + 1],
                                      pre_existing_conditions: currentConditions.filter(c => c !== cond.id)
                                    };
                                  } else {
                                    updated[idx + 1] = {
                                      ...updated[idx + 1],
                                      pre_existing_conditions: [...currentConditions, cond.id]
                                    };
                                  }
                                  setForm({ ...form, family_member_details: updated });
                                }}
                                className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all border ${isSelected
                                  ? 'bg-red-500/10 border-red-500 text-red-500'
                                  : 'bg-transparent border-border-light dark:border-white/10 opacity-60 hover:opacity-100'} disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:opacity-60`}
                              >
                                {cond.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: INSIGHTS & ACTIONS */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">

            {/* KYC ACTION - MOVED TO TOP */}
            <div className="bg-card-light dark:bg-card-dark rounded-[2.5rem] p-8 shadow-2xl border border-border-light dark:border-border-dark group animate-in slide-in-from-bottom-8 duration-700">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-6 flex items-center gap-3">
                <span className="w-8 h-px bg-current opacity-20"></span>
                <ShieldCheckIcon className="w-4 h-4" /> Identity Verification
              </h2>

              <div className="bg-background-light dark:bg-white/5 rounded-3xl p-6 border border-border-light dark:border-white/10 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xl font-black tracking-tight">KYC Status</p>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${kycStatus === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                      kycStatus === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                        kycStatus === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                          'bg-gray-500/10 text-gray-500 border-gray-500/20'
                      }`}>
                      {kycStatus === 'not_submitted' ? 'Not Submitted' : kycStatus}
                    </span>
                  </div>

                  <p className="text-sm opacity-60 mb-6 font-medium leading-relaxed max-w-[90%]">
                    {kycStatus === 'approved'
                      ? "Your identity is verified. You have full access to claim benefits."
                      : kycStatus === 'pending'
                        ? "Your verification is under review. We will notify you once approved."
                        : kycStatus === 'rejected'
                          ? "Your verification was rejected. Please review and re-submit."
                          : "Complete your identity verification to unlock full claim benefits."}
                  </p>

                  <button
                    type="button"
                    onClick={() => navigate('/client/kyc')}
                    className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${kycStatus === 'approved'
                      ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20 shadow-green-500/10'
                      : 'bg-primary-light text-white hover:bg-primary-dark shadow-primary-light/20'
                      }`}
                  >
                    <span>{kycStatus === 'approved' ? 'View Details' : kycStatus === 'rejected' ? 'Re-submit KYC' : 'Proceed to KYC'}</span>
                    <ArrowPathIcon className="w-3 h-3" />
                  </button>
                </div>

                {/* Decorative background icon */}
                <ShieldCheckIcon className={`absolute -bottom-6 -right-6 w-32 h-32 opacity-5 rotate-[-15deg] ${kycStatus === 'approved' ? 'text-green-500' :
                  kycStatus === 'rejected' ? 'text-red-500' : 'text-current'
                  }`} />
              </div>
            </div>

            {/* LIVE INSIGHT MATRIX */}
            <div className="bg-card-light dark:bg-card-dark rounded-[2.5rem] p-7 shadow-2xl border border-primary-light/20 dark:border-primary-dark/20 relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-light/10 rounded-full blur-3xl" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-light dark:text-primary-dark mb-8 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <SparklesIcon className="w-4 h-4" /> Insight Matrix
                </span>
                <span className="px-2 py-0.5 rounded bg-primary-light/10 text-[8px]">Real-Time</span>
              </h2>

              <div className="space-y-6 relative">
                <div className="flex justify-between items-end border-b border-border-light dark:border-border-dark/30 pb-4">
                  <div>
                    <p className="text-[9px] font-black uppercase opacity-40 mb-1 tracking-widest">Risk Profile</p>
                    <p className={`text-2xl font-black ${insights.riskColor} tracking-tighter`}>{insights.riskLevel}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase opacity-40 mb-1 tracking-widest">System Match</p>
                    <p className="text-2xl font-black text-text-light dark:text-text-dark tracking-tighter">{insights.matchScore}%</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-[10px] font-black uppercase opacity-40 mb-2 tracking-widest">
                      <span>Premium Impact</span>
                      <span className={insights.loading > 20 ? "text-amber-500" : insights.loading > 50 ? "text-red-500" : "text-green-500"}>
                        +{insights.loading}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-background-light dark:bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-700 ${insights.loading > 50 ? 'bg-red-500' : insights.loading > 20 ? 'bg-amber-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(insights.loading, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <p className="text-[10px] opacity-60 italic leading-relaxed">
                  {insights.loading > 50 ? "High risk loading applied." : "Optimized for base premiums."} All data is encrypted and used solely for underwriting precision.
                </p>
              </div>
            </div>

            {/* MEDICAL HISTORY */}
            <div className="bg-card-light dark:bg-card-dark rounded-[2.5rem] p-8 shadow-2xl border border-border-light dark:border-border-dark">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-6 flex items-center gap-3">
                <span className="w-8 h-px bg-current opacity-20"></span>
                <CheckCircleIcon className="w-4 h-4" />
                {form.coverage_type === 'family' ? 'Family Medical History' : 'Medical History'}
              </h2>

              <div className="space-y-3 mb-8">
                {MEDICAL_CONDITIONS.map(cond => {
                  const isSelected = form.pre_existing_conditions.includes(cond.id);
                  return (
                    <button
                      key={cond.id}
                      type="button"
                      disabled={!isEditing}
                      onClick={() => {
                        const next = isSelected
                          ? form.pre_existing_conditions.filter(c => c !== cond.id)
                          : [...form.pre_existing_conditions, cond.id];
                        setForm({ ...form, pre_existing_conditions: next });
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${isSelected
                        ? 'border-red-500 bg-red-500/10 text-red-600'
                        : 'border-border-light dark:border-border-dark opacity-50 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5'} disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:opacity-30 disabled:hover:bg-transparent`}
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest">{cond.label}</span>
                      {isSelected && <CheckCircleIcon className="w-4 h-4 text-red-500" />}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-4 mb-8">
                <label className="flex gap-3 cursor-pointer group/check">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      required
                      disabled={!isEditing}
                      className="peer appearance-none w-5 h-5 border-2 border-border-light dark:border-border-dark rounded-lg checked:bg-primary-light checked:border-primary-light transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <CheckCircleIcon className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                  <span className="text-[10px] font-bold opacity-60 group-hover/check:opacity-100 transition-opacity leading-tight">
                    I declare that all inputs (incl. height/weight) are accurate as of today. I understand misrepresentation can lead to claim rejection.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={!isEditing || updating}
                className={`w-full py-6 rounded-[2rem] text-white font-black text-[12px] uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-4 transition-all relative overflow-hidden group ${!isEditing || updating
                  ? "bg-primary-light/50 cursor-not-allowed"
                  : "bg-primary-light hover:bg-primary-dark shadow-primary-light/30 active:scale-95"}`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                {updating ? (
                  <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                ) : "Save & Optimize"}
              </button>

              <p className="text-[8px] opacity-40 text-center mt-8 uppercase font-black tracking-[0.3em] px-6 leading-loose">
                Verification may be required during claim settlement • Powered by Precision Underwriting
              </p>
            </div>

          </div>
        </form>
      </div >
    </div >
  );
};

export default MyProfile;
