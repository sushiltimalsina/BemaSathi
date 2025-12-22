import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../../api/api";
import RecommendationCard from "../components/RecommendationCard";
import { useCompare } from "../../../context/CompareContext";

const INSURANCE_TYPES = [
  { value: "health", label: "Health Insurance" },
  { value: "term-life", label: "Term Life Insurance" },
  { value: "whole-life", label: "Whole Life Insurance" },
];

const ClientDashboard = () => {
  const [user, setUser] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [error, setError] = useState("");
  const [recError, setRecError] = useState("");
  const [type, setType] = useState("health");
  const [kycStatus, setKycStatus] = useState("not_submitted");

  const navigate = useNavigate();
  const { compare } = useCompare();

  const fetchUser = async () => {
    const token = sessionStorage.getItem("client_token");
    if (!token) {
      setError("Please log in to view your dashboard.");
      setLoadingUser(false);
      return;
    }

    try {
      const res = await API.get("/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
    } catch {
      setError("Failed to fetch user details.");
    } finally {
      setLoadingUser(false);
    }
  };

  const fetchRecommendations = async (insuranceType) => {
    setLoadingPolicies(true);

    try {
      const res = await API.get("/recommendations/personal", {
        params: { insurance_type: insuranceType },
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("client_token")}`,
        },
      });

      setRecommended(res.data.recommended || []);
      setRecError("");
    } catch (err) {
      setRecError(
        err.response?.data?.message ||
          "Unable to load recommendations right now."
      );
      setRecommended([]);
    } finally {
      setLoadingPolicies(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) fetchRecommendations(type);
  }, [user, type]);

  useEffect(() => {
    const loadKyc = async () => {
      try {
        const res = await API.get("/kyc/me", {
          headers: { Authorization: `Bearer ${sessionStorage.getItem("client_token")}` },
        });
        const data = res.data?.data;
        const status = Array.isArray(data) ? data[0]?.status : data?.status;
        setKycStatus(status || "not_submitted");
      } catch {
        setKycStatus("not_submitted");
      }
    };
    loadKyc();
  }, []);

  const badgeColor =
    kycStatus === "approved"
      ? "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-100"
      : kycStatus === "pending"
      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100"
      : kycStatus === "rejected"
      ? "bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100"
      : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100";

  if (loadingUser)
    return (
      <div className="flex items-center justify-center min-h-screen text-lg text-text-light dark:text-text-dark">
        Loading dashboard...
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen text-red-600 font-semibold">
        {error}
      </div>
    );

  return (
    <div
      className="
      min-h-screen 
      bg-background-light dark:bg-background-dark
      transition-colors 
      px-4 py-10
      "
      style={{ paddingBottom: compare.length ? "140px" : "20px" }}
    >
      <div className="max-w-5xl mx-auto">

        {/* HEADER CARD */}
        <div
          className="
        rounded-3xl p-7 mb-10
        bg-card-light/90 dark:bg-card-dark/80
        border border-border-light dark:border-border-dark
        shadow-xl dark:shadow-[0_0_25px_rgba(0,0,0,0.5)]
        backdrop-blur-xl
        transition
      "
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
            Personalized Dashboard
          </p>

          <h1 className="mt-2 text-3xl font-bold text-text-light dark:text-text-dark">
            Welcome, {user?.name}
          </h1>

          <p className="mt-1 text-sm opacity-80">
            These recommendations are based on your lifestyle, budget, health
            profile, and preferences.
          </p>

          {/* STATS */}
          <div
        className="
          bg-card-light dark:bg-card-dark
          border border-border-light dark:border-border-dark
          rounded-xl p-4 mb-4
          cursor-pointer
          hover:bg-hover-light dark:hover:bg-hover-dark
          transition-all duration-200
          shadow-sm dark:shadow-[0_0_12px_rgba(0,0,0,0.6)]
          flex justify-between items-center
          text-text-light dark:text-text-dark
            "
             onClick={() => navigate("/client/kyc")}
          >
            <div>
              <div className="font-semibold text-sm">KYC Status</div>
              <div className="capitalize opacity-70 text-xs">{kycStatus}</div>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeColor}`}
        >
        {kycStatus === "not_submitted"
            ? "Not Submitted"
            : kycStatus.charAt(0).toUpperCase() + kycStatus.slice(1)}
        </span>
      </div>
        </div>

          {/* <div className="flex flex-wrap gap-2">
            <span className="px-4 py-2 rounded-xl text-xs bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark">
              Budget:{" "}
              <span className="font-semibold text-emerald-600 dark:text-emerald-300">
                {user?.budget_range || "Not Provided"}
              </span>
            </span>

            <span className="px-4 py-2 rounded-xl text-xs bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark">
              Compare Slot:{" "}
              <span className="font-semibold text-purple-600 dark:text-purple-300">
                {compare.length}/2
              </span>
            </span>
          </div>
        </div> */}

        {/* INSURANCE TYPE SWITCHER */}
        <div
  className="
    bg-card-light dark:bg-card-dark
    border border-border-light dark:border-border-dark
    rounded-2xl p-4 mb-8
    shadow-sm dark:shadow-md
    transition-all
  "
>
  <div className="flex flex-wrap gap-3">
    {INSURANCE_TYPES.map((t) => {
      const isActive = type === t.value;

      return (
        <button
          key={t.value}
          onClick={() => setType(t.value)}
          className={`
            px-4 py-2 rounded-xl text-sm font-semibold
            transition-all duration-200 border

            ${
              isActive
                ? `
                  bg-primary-light text-white border-primary-light 
                  shadow-md hover:brightness-110
                `
                : `
                  bg-card-light dark:bg-card-dark
                  text-text-light dark:text-text-dark
                  border-border-light dark:border-border-dark
                  hover:bg-hover-light dark:hover:bg-hover-dark
                `
            }
          `}
        >
          {t.label}
        </button>
      );
    })}
  </div>
</div>

        {/* RECOMMENDATIONS */}
        <div>
          <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-4">
            Recommended Policies for You
          </h2>

          {loadingPolicies ? (
            <p className="opacity-60">Loading recommendations...</p>
          ) : recommended.length === 0 ? (
            <p className="opacity-70">{recError || "No policies found."}</p>
          ) : (
            <div className="space-y-6">
              {recommended.map((policy) => (
                <RecommendationCard key={policy.id} policy={policy} user={user} kycStatus={kycStatus} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;

