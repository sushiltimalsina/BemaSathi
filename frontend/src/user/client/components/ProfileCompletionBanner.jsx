import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ExclamationTriangleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import API from "../../../api/api";

const ProfileCompletionBanner = () => {
    const [show, setShow] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Check if profile is complete and if banner was dismissed this session
        const checkProfile = async () => {
            try {
                const res = await API.get("/user/profile/check");
                const wasDismissed = sessionStorage.getItem("profile_banner_dismissed_session");

                // Show banner only if profile is incomplete AND not dismissed this session
                if (!res.data.is_complete && !wasDismissed) {
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
        // Store dismissal for this session only (clears on browser close/new login)
        sessionStorage.setItem("profile_banner_dismissed_session", "true");
    };

    if (!show || dismissed) return null;

    return (
        <div className="
            relative mb-8 p-5 rounded-3xl overflow-hidden
            bg-gradient-to-br from-amber-50/80 to-orange-100/80
            dark:from-amber-900/10 dark:to-orange-900/10
            border border-amber-200/50 dark:border-amber-500/20
            shadow-lg shadow-amber-500/5 dark:shadow-none
            backdrop-blur-md transition-all duration-300
        ">
            {/* Decorative background element */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 p-1 rounded-full text-amber-900/40 hover:text-amber-900/80 dark:text-amber-100/40 dark:hover:text-amber-100/80 hover:bg-amber-500/10 transition-all"
                title="Skip for now"
            >
                <XMarkIcon className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-500/20 dark:bg-amber-500/10 rounded-2xl flex-shrink-0">
                    <ExclamationTriangleIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>

                <div className="flex-1 pr-6">
                    <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100 mb-1">
                        Complete Your Profile for 100% Accuracy
                    </h3>
                    <p className="text-sm text-amber-900/70 dark:text-amber-100/70 mb-5 max-w-2xl leading-relaxed">
                        Precision matters in insurance. Adding your <span className="font-semibold italic">weight, height, and occupation</span> allows our core engine to calculate your BMI risk and occupational loading for a medically-accurate quote.
                    </p>

                    <div className="flex flex-wrap gap-3">
                        <Link
                            to="/client/profile/complete"
                            className="
                                px-6 py-2.5 bg-amber-600 hover:bg-amber-700 
                                text-white text-sm font-semibold rounded-xl
                                shadow-lg shadow-amber-600/20 hover:shadow-amber-600/40
                                transform hover:-translate-y-0.5 active:scale-95 transition-all
                            "
                        >
                            Refine My Pricing
                        </Link>

                        <button
                            onClick={handleDismiss}
                            className="
                                px-6 py-2.5 bg-white/50 dark:bg-white/5 
                                hover:bg-white/80 dark:hover:bg-white/10
                                text-amber-900/80 dark:text-amber-100/80
                                border border-amber-200 dark:border-amber-500/20
                                text-sm font-semibold rounded-xl backdrop-blur-sm
                                active:scale-95 transition-all
                            "
                        >
                            Skip for Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileCompletionBanner;
