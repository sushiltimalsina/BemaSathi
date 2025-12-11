import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import { useCompare } from "../../../context/CompareContext";

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

const RecommendationCard = ({ policy, user, kycStatus: kycStatusProp }) => {
  const navigate = useNavigate();
  const { compare, addToCompare, removeFromCompare } = useCompare();
  if (!policy || !policy.id) return null;

  const isAdded = compare.some((p) => p.id === policy.id);
  const compareDisabled = compare.length === 2 && !isAdded;
  const isClient = !!localStorage.getItem("client_token");
  const kycStatus = kycStatusProp ?? user?.kyc_status;

  const fmt = (n) =>
    Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

  const effectivePremium =
    policy.personalized_premium ?? policy.premium_amt ?? 0;

  const { max: budgetMax } = parseBudgetRange(user?.budget_range);
  const fitsBudget =
    !Number.isFinite(budgetMax) || effectivePremium <= budgetMax;

  let budgetText = "";
  if (!user?.budget_range) {
    budgetText = "Budget not provided.";
  } else if (!Number.isFinite(budgetMax)) {
    budgetText = `Evaluated against your budget preference (${user.budget_range}).`;
  } else if (fitsBudget) {
    budgetText = `Fits your budget (Rs. ${fmt(effectivePremium)} ≤ Rs. ${fmt(
      budgetMax
    )}).`;
  } else {
    budgetText = `Exceeds your budget by Rs. ${fmt(
      effectivePremium - budgetMax
    )}.`;
  }

  const userConditions = user?.pre_existing_conditions || [];
  const policyConditions = policy.covered_conditions || [];
  const matches = userConditions.filter((c) => policyConditions.includes(c));

  const criteria = [];

  if (user?.budget_range) criteria.push(fitsBudget);

  if (typeof user?.is_smoker !== "undefined") {
    const smokerAllowed = user.is_smoker ? policy.supports_smokers : true;
    criteria.push(smokerAllowed);
  }

  if (userConditions.length > 0) {
    criteria.push(matches.length > 0);
  }

  if (typeof policy.company_rating === "number") {
    criteria.push(policy.company_rating >= 3.5);
  }

  criteria.push(true);

  const satisfiedCriteria = criteria.filter(Boolean).length;
  const score = Math.round((satisfiedCriteria / criteria.length) * 100);

  const Green = () => (
    <CheckCircleIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
  );
  const Red = () => (
    <XCircleIcon className="w-5 h-5 text-rose-600 dark:text-rose-400" />
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

        {/* Fit Score */}
        <span
          className="
            px-3 py-1 rounded-full text-[11px] font-semibold
            bg-primary-light/20 dark:bg-primary-dark/20
            border border-primary-light/40 dark:border-primary-dark/40
            text-primary-light dark:text-primary-dark
          "
        >
          Fit Score: <span className="font-bold">{score}%</span>
        </span>
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
            Premium
          </p>

          <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-300">
            Rs. {fmt(effectivePremium)}
            {isClient && (
              <span className="block text-[10px] opacity-60">personalized</span>
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
            Rs. {fmt(policy.coverage_limit)}
          </h3>
        </div>
      </div>

      {/* Why Recommended */}
      <div className="mt-6">
        <h3 className="font-semibold mb-2 text-text-light dark:text-text-dark">
          Why this policy suits you
        </h3>

        <div
          className="
          p-4 rounded-xl 
          bg-card-light/80 dark:bg-card-dark/60
          border border-border-light dark:border-border-dark
        "
        >
          <ul className="space-y-3 text-sm">
            <li className="flex gap-2 items-start">
              {fitsBudget ? <Green /> : <Red />}
              {budgetText}
            </li>

            <li className="flex gap-2 items-start">
              {user?.is_smoker && !policy.supports_smokers ? <Red /> : <Green />}
              {policy.supports_smokers
                ? "Supports smokers."
                : user?.is_smoker
                ? "Not suitable for smokers."
                : "Optimized for non-smokers."}
            </li>

            {userConditions.length > 0 && (
              <li className="flex gap-2 items-start">
                {matches.length > 0 ? <Green /> : <Red />}
                {matches.length > 0
                  ? "Covers your pre-existing conditions."
                  : "May not cover your pre-existing conditions."}
              </li>
            )}

            <li className="flex gap-2 items-start">
              {policy.company_rating >= 3.5 ? <Green /> : <Red />}
              Company rating: {policy.company_rating}/5
            </li>
          </ul>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-col md:flex-row gap-3 md:justify-between">
        <div className="flex gap-3">
          <button
            onClick={() => {
              if (!isClient) return navigate("/login");
              if (kycStatus && kycStatus !== "approved")
                return navigate("/client/kyc");

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

          <button
            onClick={handleCompareClick}
            disabled={compareDisabled}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold border transition
              ${
                isAdded
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
