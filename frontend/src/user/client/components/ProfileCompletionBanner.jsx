import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ExclamationTriangleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import API from "../../../api/api";

const ProfileCompletionBanner = () => {
    const [show, setShow] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [missingCount, setMissingCount] = useState(0);
    const [missingLabels, setMissingLabels] = useState([]);

    useEffect(() => {
        const checkProfile = async () => {
            try {
                const res = await API.get("/user/profile/check");
                const wasDismissed = sessionStorage.getItem("profile_banner_dismissed_session");

                if (!res.data.is_complete && !wasDismissed) {
                    const missing = res.data.missing_fields || {};
                    const labels = [];
                    if (missing.dob) labels.push("Date of Birth");
                    if (missing.weight || missing.height) labels.push("Health Stats (BMI)");
                    if (missing.occupation) labels.push("Occupation");
                    if (missing.budget) labels.push("Budget Range");

                    setMissingLabels(labels);
                    setMissingCount(Object.values(missing).filter(Boolean).length);
                    setShow(true);
                }
            } catch (err) {
                console.error("Failed to check profile completion", err);
            }
        };

        checkProfile();
    }, []);

    const handleDismiss = () => {
        setDismissed(true);
        setShow(false);
        sessionStorage.setItem("profile_banner_dismissed_session", "true");
    };

    if (!show || dismissed) return null;

    return (
        <div className="
            relative mb-8 p-6 rounded-[2rem] overflow-hidden
            bg-gradient-to-r from-primary-light/10 to-amber-500/10
            dark:from-primary-dark/10 dark:to-amber-500/5
            border border-primary-light/20 dark:border-primary-dark/10
            shadow-2xl shadow-primary-light/5
            backdrop-blur-xl transition-all duration-300
        ">
            {/* Decorative Orbs */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary-light/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            <button
                onClick={handleDismiss}
                className="absolute top-5 right-5 p-1.5 rounded-full text-text-light/40 hover:text-text-light/80 dark:text-text-dark/40 dark:hover:text-text-dark/80 hover:bg-white/20 transition-all z-10"
            >
                <XMarkIcon className="w-5 h-5" />
            </button>

            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-0">
                <div className="flex-shrink-0 relative">
                    <div className="w-16 h-16 bg-white dark:bg-card-dark rounded-2xl flex items-center justify-center shadow-inner border border-border-light dark:border-border-dark">
                        <ExclamationTriangleIcon className="w-8 h-8 text-amber-500" />
                    </div>
                    {missingCount > 0 && (
                        <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg">
                            {missingCount}
                        </span>
                    )}
                </div>

                <div className="flex-1 text-center md:text-left">
                    <h3 className="text-xl font-bold text-text-light dark:text-text-dark mb-2">
                        Unlock Personalized Premium Pricing
                    </h3>

                    <p className="text-sm text-text-light/70 dark:text-text-dark/70 mb-4 max-w-2xl leading-relaxed">
                        Your current quotes are based on general market rates. To unlock
                        <span className="text-primary-light dark:text-primary-dark font-semibold"> medically-accurate, personalized pricing</span>,
                        we need a few more details:
                        <span className="italic opacity-90 ml-1">
                            {missingLabels.join(", ")}.
                        </span>
                    </p>

                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                        <Link
                            to="/client/profile"
                            className="
                                px-7 py-3 bg-primary-light hover:bg-primary-dark dark:bg-primary-dark dark:hover:bg-primary-light
                                text-white text-sm font-bold rounded-2xl
                                shadow-lg shadow-primary-light/20 hover:shadow-primary-light/40
                                transform hover:-translate-y-0.5 active:scale-95 transition-all
                            "
                        >
                            Complete Profile
                        </Link>

                        <button
                            onClick={handleDismiss}
                            className="
                                px-7 py-3 bg-white/40 dark:bg-card-dark/40 
                                hover:bg-white/60 dark:hover:bg-card-dark/60
                                text-text-light dark:text-text-dark
                                border border-border-light dark:border-border-dark
                                text-sm font-bold rounded-2xl backdrop-blur-md
                                active:scale-95 transition-all
                            "
                        >
                            Review Risks Later
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileCompletionBanner;
