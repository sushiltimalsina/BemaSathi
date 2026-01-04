import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../../../api/api";
import {
  FunnelIcon,
  ArrowsRightLeftIcon,
  ShieldCheckIcon,
  ChevronDownIcon,
  StarIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

// ---------------------------
// AGE / PREMIUM HELPERS
// ---------------------------
const calculateAge = (dob) => {
  if (!dob) return null;
  const birth = new Date(dob);
  const diff = Date.now() - birth.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
};

const ageMultiplier = (age) => {
  if (age <= 30) return 1.0;
  if (age <= 40) return 1.2;
  if (age <= 50) return 1.5;
  if (age <= 60) return 2.0;
  return 3.0;
};

// Normalize whatever backend is sending into 3 buckets
const normalizeType = (raw) => {
  if (!raw) return "unknown";
  const t = String(raw).toLowerCase();

  if (t.includes("health")) return "health";
  if (t.includes("term")) return "term-life";
  if (t.includes("whole")) return "whole-life";

  return raw; // fallback
};

const GuestPolicies = () => {
  const [policies, setPolicies] = useState([]);
  const [displayed, setDisplayed] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedType, setSelectedType] = useState("all");
  const [sortBy, setSortBy] = useState("recommended");
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterOptions = ["all", "health", "term-life", "whole-life"];

  const location = useLocation();
  const navigate = useNavigate();

  // Detect client login
  const token = sessionStorage.getItem("client_token");
  const isClient = !!token;
  const user = JSON.parse(sessionStorage.getItem("client_user") || "{}");
  const userAge = user.dob ? calculateAge(user.dob) : null;
  const multiplier = userAge ? ageMultiplier(userAge) : 1;

  // Read query params (?type, ?compareStart)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const type = params.get("type");
    const compareStart = params.get("compareStart");

    if (["health", "term-life", "whole-life"].includes(type)) {
      setSelectedType(type);
    } else {
      setSelectedType("all");
    }

    if (isClient && compareStart) {
      setSelectedForCompare([compareStart]);
    } else if (!compareStart) {
      setSelectedForCompare([]);
    }
  }, [location.search, isClient]);

  // Fetch all policies once
  useEffect(() => {
    const fetchPolicies = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await API.get("/policies");
        const data = (res.data || []).map((p) => ({
          ...p,
          normalized_type: normalizeType(p.insurance_type),
        }));
        setPolicies(data);
      } catch (err) {
        console.error(err);
        const status = err?.response?.status;
        if (!err?.response || status >= 500) {
          setError("Server down, please try again later.");
        } else {
          setError("Unable to load policies at the moment.");
        }
      }

      setLoading(false);
    };

    fetchPolicies();
  }, []);

  // Apply filters + sorting whenever policies / sortBy / selectedType change
  useEffect(() => {
    let temp = [...policies];

    // Filter by type (using normalized_type)
    if (selectedType !== "all") {
      temp = temp.filter((p) => p.normalized_type === selectedType);
    }

    // Sorting
    if (sortBy === "premium_low") {
      temp.sort((a, b) => a.premium_amt - b.premium_amt);
    } else if (sortBy === "coverage_high") {
      temp.sort((a, b) => b.coverage_limit - a.coverage_limit);
    } else {
      // "Recommended" — rough composite score
      temp.sort((a, b) => {
        const covDiff = (b.coverage_limit || 0) - (a.coverage_limit || 0);
        const premDiff = (a.premium_amt || 0) - (b.premium_amt || 0); // lower better
        const ratingDiff = (b.company_rating || 0) - (a.company_rating || 0);

        return covDiff * 2 + premDiff * 1 + ratingDiff * 3;
      });
    }

    setDisplayed(temp);
  }, [policies, sortBy, selectedType]);

  // Guest Compare Restriction
  const toggleCompareSelection = (policyId) => {
    if (!isClient) {
      navigate("/login?redirect=policies");
      return;
    }

    if (selectedForCompare.includes(policyId)) {
      setSelectedForCompare(selectedForCompare.filter((id) => id !== policyId));
      return;
    }

    if (selectedForCompare.length === 2) return;
    setSelectedForCompare([...selectedForCompare, policyId]);
  };

  const goToCompare = () => {
    if (!isClient) {
      navigate("/login?redirect=%2Fclient%2Fpolicies");
      return;
    }

    if (selectedForCompare.length !== 2) return;

    const [p1, p2] = selectedForCompare;
    navigate(`/client/compare?p1=${p1}&p2=${p2}`);
  };

  // Helper to label types on buttons
  const typeLabel = (t) => {
    if (t === "all") return "All Types";
    if (t === "health") return "Health Insurance";
    if (t === "term-life") return "Term Life";
    if (t === "whole-life") return "Whole Life";
    return t;
  };

  const applyFilterType = (type) => {
    const params = new URLSearchParams(location.search);
    if (type === "all") params.delete("type");
    else params.set("type", type);
    navigate({ search: params.toString() });
    setIsFilterOpen(false);
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Browse Insurance Policies
            </h1>
            <p className="text-sm opacity-70 mt-2">
              {isClient
                ? "Compare two policies based on your personalized premium."
                : "Login to compare and view your exact premium based on age."}
            </p>
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-3">
            <FunnelIcon className="w-5 h-5 opacity-60" />
            <div className="relative">
              <select
                className="
                  appearance-none rounded-lg text-sm px-3 py-2 pr-8
                  bg-card-light dark:bg-card-dark
                  text-text-light dark:text-text-dark
                  border border-border-light dark:border-border-dark
                "
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="recommended">Recommended</option>
                <option value="premium_low">Lowest Premium</option>
                <option value="coverage_high">Highest Coverage</option>
              </select>

              <ChevronDownIcon className="w-4 h-4 opacity-60 absolute right-2 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* MOBILE FILTER TRIGGER */}
        <div className="md:hidden mb-4">
          <button
            onClick={() => setIsFilterOpen(true)}
            className="
              inline-flex items-center gap-2 px-3 py-2 rounded-lg
              border border-border-light dark:border-border-dark
              bg-card-light dark:bg-card-dark text-sm font-semibold
              shadow-sm
            "
          >
            <FunnelIcon className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* LAYOUT */}
        <div className="grid md:grid-cols-[220px,1fr] gap-8">
          {/* FILTERS SIDEBAR */}
          <aside
            className="
              bg-card-light dark:bg-card-dark 
              rounded-2xl shadow-sm 
              border border-border-light dark:border-border-dark 
              p-4 h-fit hidden md:block
            "
          >
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <FunnelIcon className="w-5 h-5" />
              Filters
            </h2>

            <div className="space-y-3 text-sm">
              {filterOptions.map((type) => (
                <button
                  key={type}
                  onClick={() => applyFilterType(type)}
                  className={`
                    w-full text-left px-3 py-2 rounded-lg border text-sm
                    ${
                      selectedType === type
                        ? "bg-primary-light/10 dark:bg-primary-dark/20 text-primary-light dark:text-primary-dark border-primary-light dark:border-primary-dark"
                        : "bg-card-light dark:bg-card-dark border-border-light dark:border-border-dark hover:bg-hover-light dark:hover:bg-hover-dark"
                    }
                  `}
                >
                  {typeLabel(type)}
                </button>
              ))}
            </div>
          </aside>

          {/* POLICY CARDS */}
          <main>
            {loading && (
              <p className="text-center opacity-70 mt-10">Loading...</p>
            )}

            {error && (
              <p className="text-center text-red-500 mt-4">{error}</p>
            )}

            {!loading && !error && displayed.length === 0 && (
              <p className="text-center opacity-70 mt-10">
                No policies found.
              </p>
            )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayed
                .filter(
                  (policy) =>
                    !selectedForCompare.some(
                      (id) => String(id) === String(policy.id)
                    )
                )
                .map((policy) => {
                  const selected = selectedForCompare.includes(policy.id);

                  // Premium display
                  const guestMin = policy.premium_amt;
                  const guestMax = policy.premium_amt * 3;
                  const clientPremium = Math.round(
                    policy.premium_amt * multiplier
                  );

                  return (
                    <div
                      key={policy.id}
                      className="
                        bg-card-light dark:bg-card-dark 
                        rounded-2xl border border-border-light dark:border-border-dark
                        shadow-sm hover:shadow-md hover:-translate-y-0.5 
                        transition p-5 flex flex-col justify-between
                      "
                    >
                      <div>
                        {/* HEADER */}
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase opacity-60 mb-1">
                              {typeLabel(policy.normalized_type || "all")}
                            </p>

                            <h3 className="text-lg font-semibold">
                              {policy.policy_name}
                            </h3>

                            <p className="text-[11px] opacity-70">
                              by {policy.company_name}
                            </p>
                          </div>

                          <ShieldCheckIcon className="w-6 h-6 text-primary-light dark:text-primary-dark" />
                        </div>

                        {/* DETAILS */}
                        <div className="mt-4 space-y-2 text-sm">
                          {/* PREMIUM */}
                          <div className="flex justify-between">
                            <span className="opacity-80 font-medium">
                              Premium
                            </span>

                            {isClient ? (
                              <span className="font-semibold text-green-600 dark:text-green-400 text-right">
                                <span className="inline-flex items-center gap-1">
                                  <span className="font-semibold">रु. {clientPremium}</span>
                                </span>
                                <span className="block text-[10px] opacity-60">
                                  age-adjusted
                                </span>
                              </span>
                            ) : (
                              <span className="font-semibold text-right">
                                <span className="inline-flex items-center gap-1">
                                  रु. {guestMin} – {guestMax}
                                </span>
                                <span className="block text-[10px] opacity-60">
                                  login to see exact premium
                                </span>
                              </span>
                            )}
                          </div>

                          {/* COVERAGE */}
                          <div className="flex justify-between">
                            <span className="opacity-70">Coverage</span>
                            <span className="font-semibold">
                              रु. {policy.coverage_limit}
                            </span>
                          </div>

                          {/* RATING */}
                          {policy.company_rating && (
                            <div className="flex justify-between">
                              <span className="opacity-70">Rating</span>
                              <span className="font-semibold inline-flex items-center gap-1">
                                <StarIcon className="w-4 h-4 text-yellow-500" />
                                <span>{policy.company_rating}/5</span>
                              </span>
                            </div>
                          )}
                        </div>

                        {/* DESCRIPTION */}
                        {policy.policy_description && (
                          <p className="mt-3 text-xs opacity-70 line-clamp-3">
                            {policy.policy_description}
                          </p>
                        )}
                      </div>

                      {/* ACTION BUTTONS */}
                      <div className="mt-5 flex flex-col gap-2">
                        <button
                          onClick={() => navigate(`/policy/${policy.id}`)}
                          className="w-full text-sm font-medium text-primary-light dark:text-primary-dark hover:underline text-left"
                        >
                          View Details
                        </button>

                        {/* COMPARE BUTTON */}
                        {!isClient ? (
                          <button
                            onClick={() => navigate("/login")}
                            className="
                              w-full flex items-center justify-center gap-2 text-sm font-semibold 
                              rounded-lg py-2 
                              bg-hover-light dark:bg-hover-dark
                            "
                          >
                            Login to compare
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleCompareSelection(policy.id)}
                            className={`
                              w-full flex items-center justify-center gap-2 text-sm font-semibold rounded-lg py-2
                              ${
                                selected
                                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300"
                                  : "bg-primary-light text-white hover:bg-primary-dark"
                              }
                            `}
                          >
                            <ArrowsRightLeftIcon className="w-4 h-4" />
                            {selected
                              ? "Remove from compare"
                              : "Select to compare"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* COMPARE FOOTER — CLIENT ONLY */}
            {isClient && selectedForCompare.length > 0 && (
              <div
                className="
                  mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 
                  bg-card-light dark:bg-card-dark
                  border border-border-light dark:border-border-dark
                  rounded-2xl px-4 py-3 shadow-sm
                "
              >
                <div className="text-xs sm:text-sm opacity-80">
                  {selectedForCompare.length} polic
                  {selectedForCompare.length > 1 ? "ies" : "y"} selected.
                  {selectedForCompare.length < 2 && " Select one more."}
                </div>

                <button
                  disabled={selectedForCompare.length !== 2}
                  onClick={goToCompare}
                  className={`
                    inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
                    ${
                      selectedForCompare.length === 2
                        ? "bg-primary-light text-white hover:bg-primary-dark"
                        : "bg-hover-light dark:bg-hover-dark opacity-60 cursor-not-allowed"
                    }
                  `}
                >
                  <ArrowsRightLeftIcon className="w-4 h-4" />
                  Compare Selected
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-40 md:hidden bg-black/40">
          <div
            className="
              absolute bottom-0 left-0 right-0
              bg-card-light dark:bg-card-dark
              border-t border-border-light dark:border-border-dark
              rounded-t-2xl p-5 shadow-lg
            "
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <FunnelIcon className="w-5 h-5" />
                Filters
              </div>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="
                  p-2 rounded-lg border border-border-light dark:border-border-dark
                  bg-hover-light dark:bg-hover-dark
                "
                aria-label="Close filters"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              {filterOptions.map((type) => (
                <button
                  key={type}
                  onClick={() => applyFilterType(type)}
                  className={`
                    w-full text-left px-3 py-2 rounded-lg border text-sm
                    ${
                      selectedType === type
                        ? "bg-primary-light/10 dark:bg-primary-dark/20 text-primary-light dark:text-primary-dark border-primary-light dark:border-primary-dark"
                        : "bg-card-light dark:bg-card-dark border-border-light dark:border-border-dark hover:bg-hover-light dark:hover:bg-hover-dark"
                    }
                  `}
                >
                  {typeLabel(type)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestPolicies;
