import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import API from "../api/api";
import { CheckBadgeIcon, XCircleIcon, EnvelopeIcon } from "@heroicons/react/24/outline";

const VerifyEmail = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [status, setStatus] = useState("verifying"); // verifying, success, error
    const [message, setMessage] = useState("Verifying your email address...");

    useEffect(() => {
        const query = new URLSearchParams(location.search);
        const id = query.get("id");
        const hash = query.get("hash");

        if (!id || !hash) {
            setStatus("error");
            setMessage("Invalid verification link.");
            return;
        }

        const verify = async () => {
            try {
                const res = await API.get(`/email/verify/${id}/${hash}`);
                setStatus("success");
                setMessage(res.data.message || "Email verified successfully!");
            } catch (err) {
                setStatus("error");
                setMessage(err.response?.data?.message || "Verification failed. The link may have expired.");
            }
        };

        verify();
    }, [location.search]);

    return (
        <div className="min-h-screen flex items-center justify-center px-5 bg-background-light dark:bg-background-dark">
            <div className="w-full max-w-md rounded-2xl p-8 shadow-lg bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark text-center">
                {status === "verifying" && (
                    <div className="animate-pulse">
                        <EnvelopeIcon className="w-16 h-16 text-primary-light dark:text-primary-dark mx-auto mb-4 opacity-50" />
                        <h2 className="text-xl font-bold mb-2">Verifying...</h2>
                        <p className="text-sm opacity-70">{message}</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="animate-in fade-in zoom-in duration-500">
                        <CheckBadgeIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2 text-green-600 dark:text-green-400">Verified!</h2>
                        <p className="text-sm opacity-70 mb-6">{message}</p>
                        <Link
                            to="/login"
                            className="inline-block py-3 px-8 rounded-xl bg-primary-light dark:bg-primary-dark text-white font-bold text-sm shadow-lg hover:opacity-90 active:scale-95 transition-all"
                        >
                            Back to Login
                        </Link>
                    </div>
                )}

                {status === "error" && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                        <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2 text-red-600">Verification Failed</h2>
                        <p className="text-sm opacity-70 mb-6">{message}</p>
                        <Link
                            to="/register"
                            className="text-primary-light dark:text-primary-dark font-bold hover:underline"
                        >
                            Try Registering Again
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
