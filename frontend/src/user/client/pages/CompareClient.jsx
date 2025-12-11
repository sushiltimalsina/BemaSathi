import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import API from "../../../api/api";
import { useCompare } from "../../../context/CompareContext";

const formatRs = (n) => {
  const num = Number(n ?? 0);
  return `Rs. ${num.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
};

const getTitle = (p) => (p?.policy_name ? p.policy_name : "Policy");
const labelWithCompany = (p) => `${getTitle(p)} (${p.company_name})`;

const CompareClient = () => {
  const [policy1, setPolicy1] = useState(null);
  const [policy2, setPolicy2] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [typeMismatch, setTypeMismatch] = useState(false);
  const { clearCompare } = useCompare();

  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const p1 = query.get("p1");
  const p2 = query.get("p2");

  const token = localStorage.getItem("client_token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  useEffect(() => {
    if (!p1 || !p2) {
      navigate("/client/policies");
      return;
    }
    fetchUser();
    fetchPolicies();
    clearCompare();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p1, p2]);

  const fetchUser = async () => {
    try {
      const res = await API.get("/me", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("client_token")}`,
        },
      });
      setUser(res.data);
    } catch (err) {
      console.error("User fetch failed", err);
    }
  };

  const fetchPolicies = async () => {
    try {
      const r1 = await API.get(`/policies/${p1}`);
      const r2 = await API.get(`/policies/${p2}`);

      setPolicy1({
        ...r1.data,
        covered_conditions: r1.data?.covered_conditions || [],
      });

      setPolicy2({
        ...r2.data,
        covered_conditions: r2.data?.covered_conditions || [],
      });

      setTypeMismatch(r1.data.insurance_type !== r2.data.insurance_type);
    } catch (err) {
      console.error("Compare load failed", err);
    }

    setLoading(false);
  };

  const adj1 =
    policy1?.personalized_premium ?? policy1?.premium_amt ?? 0;
  const adj2 =
    policy2?.personalized_premium ?? policy2?.premium_amt ?? 0;

  const userConditions = Array.isArray(user?.pre_existing_conditions)
    ? user.pre_existing_conditions
    : [];
  const covered1 = policy1
    ? userConditions.filter((c) =>
        (policy1.covered_conditions || []).includes(c)
      ).length
    : 0;
  const covered2 = policy2
    ? userConditions.filter((c) =>
        (policy2.covered_conditions || []).includes(c)
      ).length
    : 0;
  const totalConditions = userConditions.length;

  const scorePolicy = (a, b) => {
    let s1 = 0,
      s2 = 0;
    const comparisons = [];

    const aAdj = a.personalized_premium ?? a.premium_amt ?? 0;
    const bAdj = b.personalized_premium ?? b.premium_amt ?? 0;

    if (aAdj < bAdj) {
      s1++;
      comparisons.push({
        who: "a",
        text: `${labelWithCompany(
          a
        )} offers a lower adjusted premium (${formatRs(
          aAdj
        )} vs ${formatRs(bAdj)})`,
      });
    } else if (bAdj < aAdj) {
      s2++;
      comparisons.push({
        who: "b",
        text: `${labelWithCompany(
          b
        )} offers a lower adjusted premium (${formatRs(
          bAdj
        )} vs ${formatRs(aAdj)})`,
      });
    }

    if (a.coverage_limit > b.coverage_limit) {
      s1++;
      comparisons.push({
        who: "a",
        text: `${labelWithCompany(a)} provides higher coverage (${formatRs(
          a.coverage_limit
        )} vs ${formatRs(b.coverage_limit)})`,
      });
    } else if (b.coverage_limit > a.coverage_limit) {
      s2++;
      comparisons.push({
        who: "b",
        text: `${labelWithCompany(b)} provides higher coverage (${formatRs(
          b.coverage_limit
        )} vs ${formatRs(a.coverage_limit)})`,
      });
    }

    const aRating = a.company_rating || 0;
    const bRating = b.company_rating || 0;

    if (aRating > bRating) {
      s1++;
      comparisons.push({
        who: "a",
        text: `${labelWithCompany(
          a
        )} has a stronger company rating (${aRating} vs ${bRating})`,
      });
    } else if (bRating > aRating) {
      s2++;
      comparisons.push({
        who: "b",
        text: `${labelWithCompany(
          b
        )} has a stronger company rating (${bRating} vs ${aRating})`,
      });
    }

    if (s1 > s2) {
      return {
        winner: a,
        loser: b,
        message: `${labelWithCompany(a)} is better overall for your profile.`,
        reasons: comparisons.filter((x) => x.who === "a").map((x) => x.text),
        tradeoffs: comparisons
          .filter((x) => x.who === "b")
          .map((x) => `Note: ${x.text}`),
      };
    }

    if (s2 > s1) {
      return {
        winner: b,
        loser: a,
        message: `${labelWithCompany(b)} is better overall for your profile.`,
        reasons: comparisons.filter((x) => x.who === "b").map((x) => x.text),
        tradeoffs: comparisons
          .filter((x) => x.who === "a")
          .map((x) => `Note: ${x.text}`),
      };
    }

    return {
      winner: null,
      loser: null,
      message: "Both policies are equal based on premium, coverage, and rating.",
      reasons: comparisons.map((c) => c.text),
      tradeoffs: [],
    };
  };

  if (loading || !policy1 || !policy2 || !user) {
    return (
      <p className="text-center mt-12 text-text-light dark:text-text-dark opacity-70">
        Loading comparison...
      </p>
    );
  }

  const comparison = typeMismatch ? null : scorePolicy(policy1, policy2);

  const metrics1 = {
    premiumBetter: adj1 < adj2,
    premiumEqual: adj1 === adj2,
    coverageBetter: policy1.coverage_limit > policy2.coverage_limit,
    coverageEqual: policy1.coverage_limit === policy2.coverage_limit,
    ratingBetter: (policy1.company_rating || 0) > (policy2.company_rating || 0),
    ratingEqual:
      (policy1.company_rating || 0) === (policy2.company_rating || 0),
    smokerBetter: !!policy1.supports_smokers && !policy2.supports_smokers,
    smokerEqual: !!policy1.supports_smokers === !!policy2.supports_smokers,
    conditionsBetter: covered1 > covered2,
    conditionsEqual: covered1 === covered2,
  };

  const metrics2 = {
    premiumBetter: adj2 < adj1,
    premiumEqual: adj2 === adj1,
    coverageBetter: policy2.coverage_limit > policy1.coverage_limit,
    coverageEqual: policy2.coverage_limit === policy1.coverage_limit,
    ratingBetter: (policy2.company_rating || 0) > (policy1.company_rating || 0),
    ratingEqual:
      (policy2.company_rating || 0) === (policy1.company_rating || 0),
    smokerBetter: !!policy2.supports_smokers && !policy1.supports_smokers,
    smokerEqual: !!policy2.supports_smokers === !!policy1.supports_smokers,
    conditionsBetter: covered2 > covered1,
    conditionsEqual: covered2 === covered1,
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark transition-colors">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <button
          onClick={() => navigate(-1)}
          className="
            mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg
            bg-card-light dark:bg-card-dark
            border border-border-light dark:border-border-dark
            hover:bg-hover-light dark:hover:bg-hover-dark
            text-sm font-medium
          "
        >
          &lt; Back
        </button>

        <h1 className="text-3xl font-bold text-center mb-8">
          Compare Policies
        </h1>

        {typeMismatch && (
          <div
            className="
              bg-red-50 dark:bg-red-900/20 
              border border-red-200 dark:border-red-500
              text-red-700 dark:text-red-200
              p-5 rounded-2xl text-center mb-10 shadow-sm
            "
          >
            <p className="font-semibold mb-1">Policies Cannot Be Compared</p>
            <p className="text-sm mb-3">
              You selected <b>{policy1.insurance_type}</b> and{" "}
              <b>{policy2.insurance_type}</b>. Please choose policies of the
              same type.
            </p>
            <button
              onClick={() => navigate("/client/policies")}
              className="px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 text-sm font-semibold"
            >
              Select Different Policies
            </button>
          </div>
        )}

        {!typeMismatch && comparison && (
          <div
            className="
              rounded-2xl p-6 md:p-8 mb-10 shadow-lg
              bg-card-light dark:bg-card-dark
              border border-border-light dark:border-border-dark
              text-text-light dark:text-text-dark
              transition-colors
            "
          >
            <h2 className="text-xl md:text-2xl font-bold flex justify-center items-center gap-2 text-text-light dark:text-text-dark">
              Best Option for You
            </h2>

            <p className="text-lg md:text-xl font-semibold mt-3 text-center text-text-light dark:text-text-dark">
              {comparison.message}
            </p>

            {comparison.reasons?.length > 0 && (
              <div className="mt-4 max-w-2xl mx-auto text-sm space-y-1">
                <p className="font-semibold text-text-light dark:text-text-dark">
                  Why this policy stands out:
                </p>
                <ul className="list-disc list-inside space-y-1 text-text-light dark:text-text-dark opacity-80">
                  {comparison.reasons.map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            {comparison.tradeoffs?.length > 0 && (
              <div className="mt-3 max-w-2xl mx-auto text-xs space-y-1 text-text-light dark:text-text-dark opacity-80">
                <p className="font-semibold">Tradeoffs to be aware of:</p>
                <ul className="list-disc list-inside space-y-1">
                  {comparison.tradeoffs.map((t, idx) => (
                    <li key={idx}>{t}</li>
                  ))}
                </ul>
              </div>
            )}

            {comparison.winner && (
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Link
                  to={`/client/agent?policy=${comparison.winner.id}`}
                  className="
                    px-5 py-2 rounded-lg text-sm font-semibold
                    bg-hover-light dark:bg-hover-dark border border-border-light dark:border-border-dark text-text-light dark:text-text-dark hover:opacity-90 shadow-sm transition
                  "
                >
                  View Agent
                </Link>

                <Link
                  to={`/client/buy?policy=${comparison.winner.id}`}
                  className="
                    px-5 py-2 rounded-lg text-sm font-semibold
                    bg-slate-900/80 text-white hover:bg-slate-900
                    shadow
                  "
                >
                  Buy Policy
                </Link>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PolicyCard
            policy={policy1}
            adjusted={adj1}
            user={user}
            coveredCount={covered1}
            totalConditions={totalConditions}
            metrics={metrics1}
          />
          <PolicyCard
            policy={policy2}
            adjusted={adj2}
            user={user}
            coveredCount={covered2}
            totalConditions={totalConditions}
            metrics={metrics2}
          />
        </div>
      </div>
    </div>
  );
};

const PolicyCard = ({
  policy,
  adjusted,
  user,
  coveredCount,
  totalConditions,
  metrics,
}) => {
  return (
    <div
      className="
        bg-card-light dark:bg-card-dark 
        rounded-2xl p-6 shadow-sm 
        border border-border-light dark:border-border-dark
        flex flex-col justify-between
      "
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-semibold text-primary-light dark:text-primary-dark">
            {getTitle(policy)}
          </h3>
          <span
            className="
              px-3 py-1 text-xs rounded-full
              bg-primary-light/10 dark:bg-primary-dark/20
              text-primary-light dark:text-primary-dark
              border border-primary-light/30 dark:border-primary-dark/30
            "
          >
            {policy.insurance_type}
          </span>
        </div>

        <p className="text-xs opacity-70 mb-2">
          Provided by {policy.company_name}
        </p>

        <div className="space-y-3 text-sm mt-3">
          <ComparisonRow
            label="Adjusted Premium"
            value={formatRs(adjusted)}
            better={metrics.premiumBetter}
            equal={metrics.premiumEqual}
          />

          <ComparisonRow
            label="Coverage"
            value={formatRs(policy.coverage_limit)}
            better={metrics.coverageBetter}
            equal={metrics.coverageEqual}
          />

          <ComparisonRow
            label="Rating"
            value={
              policy.company_rating
                ? `${policy.company_rating}/5`
                : "Not rated"
            }
            better={metrics.ratingBetter}
            equal={metrics.ratingEqual}
          />

          <ComparisonRow
            label="Smoker Friendly"
            value={policy.supports_smokers ? "Yes" : "No"}
            better={metrics.smokerBetter}
            equal={metrics.smokerEqual}
          />

          <ComparisonRow
            label="Covered Conditions"
            value={
              policy.covered_conditions?.length > 0
                ? policy.covered_conditions.join(", ")
                : "None"
            }
            neutral
          />

          <ComparisonRow
            label="Your Conditions Covered"
            value={
              totalConditions > 0
                ? `${coveredCount} / ${totalConditions}`
                : "No conditions added"
            }
            better={metrics.conditionsBetter}
            equal={metrics.conditionsEqual}
          />
        </div>

        {policy.policy_description && (
          <p className="mt-3 text-xs opacity-70 line-clamp-3">
            {policy.policy_description}
          </p>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          to={`/policy/${policy.id}`}
          className="
            text-sm font-semibold 
            text-text-light dark:text-text-dark 
            hover:underline
          "
        >
          View Details
        </Link>

        <Link
          to={`/client/agent?policy=${policy.id}`}
          className="
            px-4 py-2 rounded-lg text-sm font-semibold
            bg-hover-light dark:bg-hover-dark
            border border-border-light dark:border-border-dark
          "
        >
          View Agent
        </Link>
        <Link
          to={`/client/buy?policy=${policy.id}`}
          className="
            px-4 py-2 rounded-lg text-sm font-semibold
            bg-primary-light text-white hover:opacity-90 shadow
          "
        >
          Buy this Policy
        </Link>
      </div>
    </div>
  );
};

const ComparisonRow = ({
  label,
  value,
  better = false,
  equal = false,
  neutral = false,
}) => {
  let colorClass = "text-red-500";
  if (neutral || equal) colorClass = "text-text-light dark:text-text-dark";
  else if (better) colorClass = "text-success-light dark:text-success-dark";

  return (
    <p className="flex justify-between gap-4">
      <span className="text-xs sm:text-sm opacity-70">{label}:</span>
      <span className={`text-xs sm:text-sm font-semibold ${colorClass}`}>
        {value}
      </span>
    </p>
  );
};

export default CompareClient;
