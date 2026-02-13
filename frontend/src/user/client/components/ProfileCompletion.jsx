import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../../api/api";
import {
    UserCircleIcon,
    HeartIcon,
    SparklesIcon,
    CheckCircleIcon,
    ArrowPathIcon
} from "@heroicons/react/24/outline";

const BUDGET_RANGES = ["< 5k/yr", "5k-10k", "10k-20k", "20k-50k", "50k+"];
const MEDICAL_CONDITIONS = [
    { id: "diabetes", label: "Diabetes" },
    { id: "heart", label: "Heart Issues" },
    { id: "hypertension", label: "Hypertension" },
    { id: "asthma", label: "Asthma" },
];

const ProfileCompletion = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        dob: "",
        weight_kg: "",
        height_cm: "",
        occupation_class: "class_1",
        is_smoker: false,
        budget_range: "10k-20k",
        coverage_type: "individual",
        family_members: 1,
        pre_existing_conditions: [],
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [bmi, setBmi] = useState(null);

    // Calculate BMI
    useEffect(() => {
        if (form.weight_kg && form.height_cm) {
            const h = form.height_cm / 100;
            const res = (form.weight_kg / (h * h)).toFixed(1);
            setBmi(res);
        } else {
            setBmi(null);
        }
    }, [form.weight_kg, form.height_cm]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await API.put("/user/profile", form);
            navigate("/client/dashboard");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const getBmiStatus = (val) => {
        const v = parseFloat(val);
        if (v < 18.5) return { label: "Underweight", color: "text-blue-500" };
        if (v < 25) return { label: "Healthy", color: "text-green-500" };
        if (v < 30) return { label: "Overweight", color: "text-yellow-500" };
        return { label: "Obese", color: "text-red-500" };
    };

    return (
        <div className="min-h-screen pt-20 pb-12 px-5 bg-background-light dark:bg-background-dark">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-10">
                    <SparklesIcon className="w-12 h-12 text-primary-light dark:text-primary-dark mx-auto mb-4 animate-pulse" />
                    <h1 className="text-3xl font-black tracking-tight text-text-light dark:text-text-dark">
                        Precision Recommendation
                    </h1>
                    <p className="text-sm opacity-60 mt-2 max-w-lg mx-auto leading-relaxed">
                        Complete these details to unlock your personalized **Insurance Recommendation Matrix**
                        and see exactly how your lifestyle affects your premium.
                    </p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-600 text-sm p-4 rounded-xl mb-6 text-center animate-in shake duration-500">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT COLUMN: BASIC & LIFESTYLE */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* SECTION 1: HEALTH BASICS */}
                        <div className="bg-card-light dark:bg-card-dark rounded-3xl p-6 shadow-xl shadow-black/5 border border-border-light dark:border-border-dark">
                            <h2 className="text-xs font-black uppercase tracking-widest opacity-40 mb-6 flex items-center gap-2">
                                <HeartIcon className="w-4 h-4" /> Health Basics
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 block mb-1">Date of Birth</label>
                                    <input
                                        type="date"
                                        value={form.dob}
                                        onChange={(e) => setForm({ ...form, dob: e.target.value })}
                                        className="w-full px-4 py-3 text-sm rounded-xl bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary-light/40 transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 block mb-1">Weight (kg)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={form.weight_kg}
                                        onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
                                        placeholder="e.g., 70"
                                        className="w-full px-4 py-3 text-sm rounded-xl bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary-light/40 transition-all font-bold"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 block mb-1">Height (cm)</label>
                                    <input
                                        type="number"
                                        value={form.height_cm}
                                        onChange={(e) => setForm({ ...form, height_cm: e.target.value })}
                                        placeholder="e.g., 175"
                                        className="w-full px-4 py-3 text-sm rounded-xl bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary-light/40 transition-all font-bold"
                                        required
                                    />
                                </div>
                            </div>

                            {/* BMI INDICATOR */}
                            {bmi && (
                                <div className="mt-6 p-4 rounded-2xl bg-primary-light/5 border border-primary-light/10 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase opacity-40 tracking-widest">Calculated BMI</p>
                                        <p className={`text-2xl font-black ${getBmiStatus(bmi).color}`}>{bmi}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm font-bold ${getBmiStatus(bmi).color}`}>{getBmiStatus(bmi).label}</p>
                                        <p className="text-[10px] opacity-40">Affects Medical Premium</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* SECTION 2: LIFESTYLE & BUDGET */}
                        <div className="bg-card-light dark:bg-card-dark rounded-3xl p-6 shadow-xl shadow-black/5 border border-border-light dark:border-border-dark">
                            <h2 className="text-xs font-black uppercase tracking-widest opacity-40 mb-6 flex items-center gap-2">
                                <ArrowPathIcon className="w-4 h-4" /> Lifestyle & Priorities
                            </h2>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 block mb-3">Occupation Hazard Level</label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        {[
                                            { id: "class_1", label: "Office / Low Risk", desc: "No physical peril" },
                                            { id: "class_2", label: "Field / Moderate", desc: "Travel & Activity" },
                                            { id: "class_3", label: "Manual / High Risk", desc: "Industrial / Construction" },
                                        ].map(occ => (
                                            <button
                                                key={occ.id}
                                                type="button"
                                                onClick={() => setForm({ ...form, occupation_class: occ.id })}
                                                className={`p-4 rounded-2xl border text-left transition-all ${form.occupation_class === occ.id
                                                    ? 'border-primary-light bg-primary-light/10 ring-2 ring-primary-light/20'
                                                    : 'border-border-light dark:border-border-dark opacity-60 hover:opacity-100'}`}
                                            >
                                                <p className="text-xs font-bold">{occ.label}</p>
                                                <p className="text-[10px] opacity-50">{occ.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 block mb-3">Smoking Status</label>
                                        <div className="flex bg-background-light dark:bg-background-dark p-1 rounded-xl border border-border-light dark:border-border-dark">
                                            <button
                                                type="button"
                                                onClick={() => setForm({ ...form, is_smoker: false })}
                                                className={`flex-1 py-3 px-4 rounded-lg text-xs font-bold transition-all ${!form.is_smoker ? 'bg-primary-light text-white shadow-lg' : 'opacity-40'}`}
                                            >
                                                Non-Smoker
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setForm({ ...form, is_smoker: true })}
                                                className={`flex-1 py-3 px-4 rounded-lg text-xs font-bold transition-all ${form.is_smoker ? 'bg-red-500 text-white shadow-lg' : 'opacity-40'}`}
                                            >
                                                Smoker
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 block mb-3">Annual Budget</label>
                                        <div className="flex flex-wrap gap-2">
                                            {BUDGET_RANGES.map(br => (
                                                <button
                                                    key={br}
                                                    type="button"
                                                    onClick={() => setForm({ ...form, budget_range: br })}
                                                    className={`px-3 py-2 rounded-xl text-[10px] font-black border transition-all ${form.budget_range === br
                                                        ? 'border-primary-light bg-primary-light text-white shadow-lg'
                                                        : 'border-border-light dark:border-border-dark opacity-60 hover:opacity-100'}`}
                                                >
                                                    {br}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: SUMMARY & CONDITIONS */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* MEDICAL CONDITIONS */}
                        <div className="bg-card-light dark:bg-card-dark rounded-3xl p-6 shadow-xl shadow-black/5 border border-border-light dark:border-border-dark lg:sticky lg:top-24">
                            <h2 className="text-xs font-black uppercase tracking-widest opacity-40 mb-6 flex items-center gap-2">
                                <CheckCircleIcon className="w-4 h-4" /> Medical History
                            </h2>

                            <div className="space-y-3 mb-8">
                                {MEDICAL_CONDITIONS.map(cond => {
                                    const isSelected = form.pre_existing_conditions.includes(cond.id);
                                    return (
                                        <button
                                            key={cond.id}
                                            type="button"
                                            onClick={() => {
                                                const next = isSelected
                                                    ? form.pre_existing_conditions.filter(c => c !== cond.id)
                                                    : [...form.pre_existing_conditions, cond.id];
                                                setForm({ ...form, pre_existing_conditions: next });
                                            }}
                                            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${isSelected
                                                ? 'border-red-500 bg-red-500/10 text-red-600'
                                                : 'border-border-light dark:border-border-dark opacity-50'}`}
                                        >
                                            <span className="text-xs font-bold uppercase tracking-tight">{cond.label}</span>
                                            {isSelected && <CheckCircleIcon className="w-4 h-4" />}
                                        </button>
                                    );
                                })}
                                {form.pre_existing_conditions.length === 0 && (
                                    <div className="text-center py-4 border border-dashed border-border-light dark:border-border-dark rounded-2xl opacity-40">
                                        <span className="text-[10px] font-bold uppercase italic">No Conditions Selected</span>
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-5 rounded-2xl text-white font-black text-sm shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all ${loading
                                    ? "bg-primary-light/50 cursor-not-allowed"
                                    : "bg-primary-light hover:bg-primary-dark shadow-primary-light/40"}`}
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Complete Profile
                                        <ArrowPathIcon className="w-5 h-5" />
                                    </>
                                )}
                            </button>

                            <p className="text-[9px] opacity-40 text-center mt-6 uppercase font-black tracking-widest px-4">
                                Data is used strictly for recommendation accuracy & price calculation
                            </p>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileCompletion;
