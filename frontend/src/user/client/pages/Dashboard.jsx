import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../../api/api";
import RecommendationCard from "../components/RecommendationCard";
import ProfileCompletionBanner from "../components/ProfileCompletionBanner";
import { useCompare } from "../../../context/CompareContext";

const INSURANCE_TYPES = [
  { value: "health", label: "Health Insurance" },
  { value: "term-life", label: "Term Life Insurance" },
  { value: "whole-life", label: "Whole Life Insurance" },
];

const ClientDashboard = () => {
  const [user, setUser] = useState(() => {
    const cached = sessionStorage.getItem("client_user");
    return cached ? JSON.parse(cached) : null;
  });
  const [recommended, setRecommended] = useState([]);
  const [loadingUser, setLoadingUser] = useState(!sessionStorage.getItem("client_user"));
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [error, setError] = useState("");
  const [recError, setRecError] = useState("");
  const [type, setType] = useState("health");
  const [kycStatus, setKycStatus] = useState("not_submitted");
  const [allowEdit, setAllowEdit] = useState(false);
  const [ownedMap, setOwnedMap] = useState({});
  const [profileComplete, setProfileComplete] = useState(false);

  const navigate = useNavigate();
  const { compare } = useCompare();

  const [showMore, setShowMore] = useState(false);

  const fetchUser = async (attempt = 1) => {
    try {
      // Check both sessionStorage and localStorage for token
      let token = sessionStorage.getItem("client_token") || localStorage.getItem("token");

      if (!token) {
        if (attempt < 3) {
          setTimeout(() => fetchUser(attempt + 1), 200);
          return;
        }
        setError("Please log in to view your dashboard.");
        setLoadingUser(false);
        return;
      }

      // If we already have the user in state from cache, we can still fetch in background to sync
      // but we don't need to block UI.
      const res = await API.get("/me");
      setUser(res.data);
      sessionStorage.setItem("client_user", JSON.stringify(res.data));
      setError("");
      setLoadingUser(false);
    } catch (err) {
      console.error("Failed to fetch user details:", err);

      // Retry logic for network errors or 401/403
      if (attempt < 3 && (err.response?.status === 401 || !err.response)) {
        setTimeout(() => fetchUser(attempt + 1), 500);
        return;
      }

      // If all retries failed
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError("Session expired. Please log in again.");
        setTimeout(() => {
          localStorage.removeItem("token");
          sessionStorage.removeItem("client_token");
          sessionStorage.removeItem("client_user");
          window.location.href = "/login";
        }, 1500);
      } else {
        setError("Failed to load dashboard. Please refresh the page.");
      }
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

    // Parallelize secondary data fetching
    const loadSecondaryData = async () => {
      try {
        const [requestsRes, profileRes, kycRes] = await Promise.all([
          API.get("/my-requests"),
          API.get("/user/profile/check"),
          API.get("/kyc/me")
        ]);

        // Process My Requests
        const map = {};
        (requestsRes.data || []).forEach((r) => {
          if (r.policy_id) map[r.policy_id] = r;
        });
        setOwnedMap(map);

        // Process Profile
        setProfileComplete(!!profileRes.data.is_complete);

        // Process KYC
        const kycData = kycRes.data?.data;
        const latest = Array.isArray(kycData) ? kycData[0] : kycData;
        setKycStatus(latest?.status || "not_submitted");
        setAllowEdit(Boolean(latest?.allow_edit));
      } catch (err) {
        console.log("Error loading dashboard details:", err);
      }
    };

    loadSecondaryData();
  }, []);

  useEffect(() => {
    if (user) {
      setShowMore(false);
      fetchRecommendations(type);
    }
  }, [user, type]);

  useEffect(() => {
    const handleProfileUpdated = (event) => {
      const nextUser = event?.detail?.user;
      if (nextUser) {
        setUser(nextUser);
      } else {
        fetchUser();
      }

      // Re-check profile completion on update
      API.get("/user/profile/check").then(res => {
        setProfileComplete(!!res.data.is_complete);
      }).catch(() => { });
    };

    window.addEventListener("profile:updated", handleProfileUpdated);
    return () => window.removeEventListener("profile:updated", handleProfileUpdated);
  }, []);

  const badgeColor =
    kycStatus === "approved" && allowEdit
      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100"
      : kycStatus === "approved"
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
              {kycStatus === "approved" && allowEdit
                ? "Reapproval Needed"
                : kycStatus === "not_submitted"
                  ? "Not Submitted"
                  : kycStatus.charAt(0).toUpperCase() + kycStatus.slice(1)}
            </span>
          </div>

          {/* Profile Completion Banner */}
          <ProfileCompletionBanner />
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

            ${isActive
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
              {recommended.slice(0, showMore ? 5 : 3).map((policy) => (
                <RecommendationCard
                  key={policy.id}
                  policy={policy}
                  user={user}
                  kycStatus={kycStatus}
                  ownedRequest={ownedMap?.[policy.id]}
                  profileComplete={profileComplete}
                />
              ))}

              {/* ACTION BUTTONS */}
              <div className="mt-12 flex flex-col sm:flex-row gap-6 items-center justify-center border-t border-border-light dark:border-border-dark pt-10">
                {!showMore && recommended.length > 3 && (
                  <button
                    onClick={() => setShowMore(true)}
                    className="
                      px-8 py-3 rounded-xl 
                      bg-primary-light dark:bg-primary-dark text-white 
                      text-sm font-bold uppercase tracking-widest 
                      shadow-lg shadow-primary-light/20 hover:opacity-90 active:scale-95 transition-all
                    "
                  >
                    View More Recommendations
                  </button>
                )}

                <button
                  onClick={() => navigate("/client/policies")}
                  className="
                    px-8 py-3 rounded-xl 
                    border border-primary-light dark:border-primary-dark 
                    text-primary-light dark:text-primary-dark
                    text-sm font-bold uppercase tracking-widest 
                    hover:bg-primary-light/5 active:scale-95 transition-all
                  "
                >
                  Explore All Policies
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
