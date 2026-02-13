import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../../api/api";
import { UserCircleIcon } from "@heroicons/react/24/outline";

const ProfileCompletion = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        weight_kg: "",
        height_cm: "",
        occupation_class: "class_1",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await API.put("/user/profile", form);
            navigate("/client/dashboard");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update profile");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-5 bg-background-light dark:bg-background-dark">
            <div className="w-full max-w-md rounded-2xl p-8 shadow-lg bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark">

                <div className="text-center mb-6">
                    <UserCircleIcon className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto" />
                    <h1 className="text-2xl font-bold mt-3 text-text-light dark:text-text-dark">
                        Complete Your Profile
                    </h1>
                    <p className="text-sm opacity-70 mt-2 text-text-light dark:text-text-dark">
                        Help us calculate your <span className="font-semibold text-green-600">most accurate premium</span>
                    </p>
                </div>

                {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Weight */}
                    <div>
                        <label className="text-xs font-semibold opacity-80 text-text-light dark:text-text-dark">
                            Weight (kg)
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            value={form.weight_kg}
                            onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
                            placeholder="e.g., 65.5"
                            className="w-full mt-1 px-3 py-2 text-sm rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-green-500/50"
                            required
                        />
                        <p className="text-[11px] opacity-60 mt-1 text-text-light dark:text-text-dark">
                            Your approximate weight in kilograms
                        </p>
                    </div>

                    {/* Height */}
                    <div>
                        <label className="text-xs font-semibold opacity-80 text-text-light dark:text-text-dark">
                            Height (cm)
                        </label>
                        <input
                            type="number"
                            value={form.height_cm}
                            onChange={(e) => setForm({ ...form, height_cm: e.target.value })}
                            placeholder="e.g., 170"
                            className="w-full mt-1 px-3 py-2 text-sm rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-green-500/50"
                            required
                        />
                        <p className="text-[11px] opacity-60 mt-1 text-text-light dark:text-text-dark">
                            Your height in centimeters
                        </p>
                    </div>

                    {/* Occupation */}
                    <div>
                        <label className="text-xs font-semibold opacity-80 text-text-light dark:text-text-dark">
                            Occupation Type
                        </label>
                        <select
                            value={form.occupation_class}
                            onChange={(e) => setForm({ ...form, occupation_class: e.target.value })}
                            className="w-full mt-1 px-3 py-2 rounded-lg text-sm bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-text-light dark:text-text-dark"
                            required
                        >
                            <option value="class_1">Office / Desk Job</option>
                            <option value="class_2">Field Work / Sales / Driver</option>
                            <option value="class_3">Manual Labor / Construction</option>
                        </select>
                        <p className="text-[11px] opacity-60 mt-1 text-text-light dark:text-text-dark">
                            Helps us assess occupational risk
                        </p>
                    </div>

                    {/* Info Box */}
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                        <p className="text-xs text-green-800 dark:text-green-300">
                            <span className="font-semibold">Why we need this:</span> These details help us calculate your Body Mass Index (BMI) and occupation risk, ensuring you get the most accurate premium quote tailored to your health profile.
                        </p>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 rounded-lg text-white font-semibold text-sm transition ${loading ? "bg-green-400/50 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
                            }`}
                    >
                        {loading ? "Updating..." : "Continue to Dashboard"}
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/client/dashboard")}
                        className="w-full py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition"
                    >
                        Skip for now
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfileCompletion;
