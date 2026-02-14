import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import { useCompare } from "../../../context/CompareContext";
import { isRenewable } from "../../utils/renewal";

const parseBudgetRange = (range) => {
  switch (range) {
    case "<10000":
      return { min: 0, max: 10000 };
    case "10000-20000":
      return { min: 10000, max: 20000 };
    case "20000-30000":
      return { min: 20000, max: 30000 };
    case ">30000":
      return { min: 30000, max: Infinity };
    default:
      return { min: 0, max: Infinity };
  }
};

const RecommendationCard = ({
  policy,
  user,
  kycStatus: kycStatusProp,
  ownedRequest,
  profileComplete,
}) => {
  const navigate = useNavigate();
  const { compare, addToCompare, removeFromCompare } = useCompare();
  if (!policy || !policy.id) return null;

  const isAdded = compare.some((p) => p.id === policy.id);
  const compareDisabled = compare.length === 2 && !isAdded;
  const isClient = !!sessionStorage.getItem("client_token");
  const kycStatus = kycStatusProp ?? user?.kyc_status;
  const isOwned = Boolean(ownedRequest);
  const renewalBlocked = isOwned && !isRenewable(ownedRequest);

  const fmt = (n) =>
    Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

  const effectivePremium =
    policy.personalized_premium ?? policy.premium_amt ?? 0;

  // Use the enhanced score and reasons from the API
  const score = policy.match_score ?? 0;
  const reasons = policy.match_reasons || [];

  const Green = () => (
    <CheckCircleIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
  );

  const handleCompareClick = () => {
    if (!isClient) return navigate("/login");
    if (isAdded) removeFromCompare(policy.id);
    else addToCompare(policy);
  };

  return (
    <div
      className="
      mb-6 rounded-2xl 
      bg-card-light dark:bg-card-dark
      border border-border-light dark:border-border-dark
      shadow-md hover:shadow-xl 
      transition-all duration-300
      p-6
    "
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-text-light dark:text-text-dark">
            {policy.policy_name}
          </h2>
          <p className="text-xs opacity-60">{policy.company_name}</p>
        </div>

        {/* Fit Score & Approval Likelihood */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            {policy.approval_likelihood && (
              <span
                className={`
                  px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                  ${policy.approval_likelihood === 'Guaranteed' || policy.approval_likelihood === 'High'
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : policy.approval_likelihood === 'Medium'
                      ? 'bg-amber-100 text-amber-700 border border-amber-200'
                      : 'bg-rose-100 text-rose-700 border border-rose-200'
                  }
                `}
              >
                {policy.approval_likelihood} Approval
              </span>
            )}
            <span
              className="
                px-3 py-1 rounded-full text-[11px] font-semibold
                bg-primary-light/20 dark:bg-primary-dark/20
                border border-primary-light/40 dark:border-primary-dark/40
                text-primary-light dark:text-primary-dark
              "
            >
              Match Score: <span className="font-bold">{score}%</span>
            </span>
          </div>

          <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-light dark:bg-primary-dark transition-all duration-1000"
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      </div>

      {/* Premium + Coverage */}
      <div className="grid md:grid-cols-2 gap-4 mt-5">
        <div
          className="
          p-4 rounded-xl 
          bg-emerald-500/10 dark:bg-emerald-500/20
          border border-emerald-500/20 dark:border-emerald-500/30
        "
        >
          <p className="text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-300">
            {profileComplete ? "Your Premium" : "Premium Starts From"}
          </p>

          <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-300">
            रु. {fmt(effectivePremium)}
            {isClient && profileComplete && (
              <span className="block text-[10px] opacity-60">personalized quote</span>
            )}
            {isClient && !profileComplete && (
              <span className="block text-[10px] opacity-60 italic text-amber-600 dark:text-amber-400">Complete profile for precision price</span>
            )}
          </h3>
        </div>

        <div
          className="
          p-4 rounded-xl 
          bg-blue-500/10 dark:bg-blue-500/20
          border border-blue-500/20 dark:border-blue-500/30
        "
        >
          <p className="text-xs font-semibold uppercase text-blue-600 dark:text-blue-300">
            Coverage
          </p>
          <h3 className="text-xl font-bold text-blue-600 dark:text-blue-300">
            रु. {fmt(policy.coverage_limit)}
          </h3>
        </div>
      </div>

      {/* Enhanced Matching Reasons */}
      <div className="mt-6">
        <h3 className="font-semibold mb-3 text-text-light dark:text-text-dark text-sm">
          Why this fits your profile
        </h3>

        <div
          className="
          p-4 rounded-xl 
          bg-card-light/80 dark:bg-card-dark/60
          border border-border-light dark:border-border-dark
        "
        >
          <ul className="space-y-3 text-sm">
            {reasons.length > 0 ? (
              reasons.map((reason, idx) => (
                <li key={idx} className="flex gap-2 items-center">
                  <Green />
                  <span className="text-text-light/80 dark:text-text-dark/80">{reason}</span>
                </li>
              ))
            ) : (
              <li className="flex gap-2 items-center text-muted-light">
                No specific highlights available.
              </li>
            )}
            <li className="flex gap-2 items-center border-t border-border-light dark:border-border-dark pt-2 mt-2">
              <span className="text-[11px] opacity-60 italic">
                {profileComplete
                  ? "Personalized analysis based on your full health and lifestyle profile."
                  : "Basic match based on limited profile details. Complete your profile for better precision."
                }
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-col md:flex-row gap-3 md:justify-between">
        <div className="flex gap-3">
          {isOwned ? (
            <button
              onClick={() => {
                if (renewalBlocked) {
                  // 1. Profile Completion Check
                  if (!profileComplete) {
                    return navigate("/client/profile", {
                      state: {
                        msg: "Please complete your profile details before purchasing a policy again.",
                        returnTo: `/client/buy?policy=${policy.id}`
                      }
                    });
                  }

                  // 2. KYC Verification Check
                  if (kycStatus !== "approved") {
                    return navigate(`/client/kyc?policy=${policy.id}`, {
                      state: { msg: "Please verify your KYC before purchasing again." }
                    });
                  }

                  navigate(`/client/buy?policy=${policy.id}`);
                  return;
                }
                navigate(`/client/payment?request=${ownedRequest?.id}`);
              }}
              className="
                px-5 py-2.5 rounded-xl text-sm font-semibold text-white
                bg-primary-light hover:brightness-110
                shadow-md hover:shadow-lg hover:-translate-y-px
                transition
              "
            >
              {renewalBlocked ? "Buy Again" : "Renew Now"}
            </button>
          ) : (
            <button
              onClick={() => {
                if (!isClient) return navigate("/login");

                // 1. Profile Completion Check
                if (!profileComplete) {
                  return navigate("/client/profile", {
                    state: {
                      msg: "Please complete your profile details (Phone, Address, Height, Weight) before purchasing a policy.",
                      returnTo: `/client/buy?policy=${policy.id}`
                    }
                  });
                }

                // 2. KYC Verification Check
                if (kycStatus !== "approved") {
                  return navigate(`/client/kyc?policy=${policy.id}`, {
                    state: {
                      msg: "Your identity verification (KYC) is required to proceed with this purchase."
                    }
                  });
                }

                // 3. Both Complete -> Buy Request Page
                navigate(`/client/buy?policy=${policy.id}`);
              }}
              className="
                px-5 py-2.5 rounded-xl text-sm font-semibold text-white
                bg-primary-light hover:brightness-110
                shadow-md hover:shadow-lg hover:-translate-y-px
                transition
              "
            >
              Buy / Request
            </button>
          )}

          <button
            onClick={handleCompareClick}
            disabled={compareDisabled}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold border transition
              ${isAdded
                ? "bg-primary-light text-white border-primary-light"
                : "bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark border-border-light dark:border-border-dark hover:bg-hover-light dark:hover:bg-hover-dark"
              }
              ${compareDisabled ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            {isAdded ? "Selected" : "Compare"}
          </button>
        </div>

        <Link
          to={`/policy/${policy.id}`}
          className="text-primary-light dark:text-primary-dark text-sm font-semibold hover:underline"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default RecommendationCard;
