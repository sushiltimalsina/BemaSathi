import React, { useEffect, useState } from "react";
import API from "../../../api/api";
import { useNavigate, useLocation } from "react-router-dom";
import useAuthSyncReady from "../../../hooks/useAuthSyncReady";
import { useCompare } from "../../../context/CompareContext";
import {
  ShieldCheckIcon,
  StarIcon,
  BookmarkIcon,
  BookmarkSlashIcon,
  ArrowsRightLeftIcon,
} from "@heroicons/react/24/outline";

const AllPolicies = () => {
  const [policies, setPolicies] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [saved, setSaved] = useState([]);
  const [ownedMap, setOwnedMap] = useState({});
  const [kycStatus, setKycStatus] = useState("loading");
  const [kycAllowEdit, setKycAllowEdit] = useState(false);
  const { compare, addToCompare, removeFromCompare } = useCompare();

  const location = useLocation();
  const navigate = useNavigate();
  const ready = useAuthSyncReady();

  const token = sessionStorage.getItem("client_token");
  const isClient = ready && !!token;

  const getTypeFromQuery = () => {
    const params = new URLSearchParams(location.search);
    const type = params.get("type");
    return ["health", "term-life", "whole-life"].includes(type) ? type : "all";
  };

  const getCompareStartFromQuery = () => {
    const params = new URLSearchParams(location.search);
    return params.get("compareStart");
  };

  const [typeFilter, setTypeFilter] = useState(getTypeFromQuery);
  const [sortOption, setSortOption] = useState("recommended");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recommendedOrder, setRecommendedOrder] = useState([]);
  const [showCompareHint, setShowCompareHint] = useState(false);

  const effectivePremium = (p) => {
    const val =
      p.personalized_premium !== undefined && p.personalized_premium !== null
        ? p.personalized_premium
        : p.premium_amt;
    return Number(val) || 0;
  };

  const fmt = (n) =>
    Number(n || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });

  // LOAD POLICIES
  useEffect(() => {
    fetchPolicies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isClient) {
      fetchSaved();
      fetchOwned();
      fetchKycStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient]);

  useEffect(() => {
    const handleProfileUpdated = () => {
      fetchPolicies();
    };

    window.addEventListener("profile:updated", handleProfileUpdated);
    return () =>
      window.removeEventListener("profile:updated", handleProfileUpdated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // URL changes update filters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get("type");
    const hint = params.get("compareHint");

    setTypeFilter(["health", "term-life", "whole-life"].includes(t) ? t : "all");
    setShowCompareHint(hint === "1");
  }, [location.search]);

  // Re-filter when filters change
  useEffect(() => {
    applyFilters();
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [policies, typeFilter, sortOption]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [page]);

  useEffect(() => {
    if (!isClient) return;
    const startId = getCompareStartFromQuery();
    if (!startId) return;
    if (compare.some((p) => String(p.id) === String(startId))) return;
    const policy = policies.find((p) => String(p.id) === String(startId));
    if (policy) {
      addToCompare(policy);
    }
  }, [compare, policies, location.search, isClient, addToCompare]);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get("/policies");
      const list = res.data || [];
      setPolicies(list);
      setRecommendedOrder(buildRecommendedOrder(list));
    } catch (err) {
      console.error("Error loading policies:", err);
      const status = err?.response?.status;
      if (!err?.response || status >= 500) {
        setError("Server down, please try again later.");
      } else {
        setError("Unable to load policies at the moment.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSaved = async () => {
    if (!isClient) return;
    try {
      const res = await API.get("/saved");
      const ids =
        Array.isArray(res.data) && res.data.length
          ? res.data.map((s) => s.policy_id)
          : [];
      setSaved(ids);
    } catch (err) {
      console.error("Error loading saved policies:", err);
    }
  };

  const fetchOwned = async () => {
    try {
      const res = await API.get("/my-requests");
      const map = {};
      (res.data || []).forEach((req) => {
        if (req.policy_id) {
          map[String(req.policy_id)] = req.id;
        }
      });
      setOwnedMap(map);
    } catch (err) {
      console.error("Owned requests fetch failed", err);
      setOwnedMap({});
    }
  };

  const fetchKycStatus = async () => {
    try {
      const res = await API.get("/kyc/me");
      const list = res.data?.data || [];
      const latest = Array.isArray(list) ? list[0] : list;
      setKycStatus(latest?.status || "not_submitted");
      setKycAllowEdit(Boolean(latest?.allow_edit));
    } catch (err) {
      console.error("KYC status fetch failed", err);
      setKycStatus("not_submitted");
      setKycAllowEdit(false);
    }
  };

  const ensureKycApproved = () => {
    if (kycStatus === "approved" && !kycAllowEdit) {
      return true;
    }
    navigate("/client/kyc");
    return false;
  };

  const applyFilters = () => {
    let temp = [...policies];

    if (typeFilter !== "all") {
      temp = temp.filter((p) => p.insurance_type === typeFilter);
    }

    if (sortOption === "recommended") {
      const indexById = new Map(
        recommendedOrder.map((id, idx) => [String(id), idx])
      );
      temp.sort(
        (a, b) =>
          (indexById.get(String(a.id)) ?? Number.MAX_SAFE_INTEGER) -
          (indexById.get(String(b.id)) ?? Number.MAX_SAFE_INTEGER)
      );
    } else if (sortOption === "premium_low") {
      temp.sort((a, b) => effectivePremium(a) - effectivePremium(b));
    } else if (sortOption === "coverage_high") {
      temp.sort((a, b) => (b.coverage_limit || 0) - (a.coverage_limit || 0));
    }

    setFiltered(temp);
  };

  const toggleSave = async (id) => {
    if (!isClient) {
      navigate("/login");
      return;
    }

    try {
      if (saved.includes(id)) {
        await API.delete(`/saved/${id}`);
        setSaved((prev) => prev.filter((x) => x !== id));
      } else {
        await API.post("/saved", { policy_id: id });
        setSaved((prev) => [...prev, id]);
      }
    } catch (err) {
      console.error("Save toggle failed", err);
    }
  };

  const toggleSelect = (policy) => {
    if (!isClient) {
      navigate("/login");
      return;
    }

    if (!policy || !policy.id) {
      return;
    }

    const idStr = String(policy.id);
    if (compare.some((p) => String(p.id) === idStr)) {
      removeFromCompare(policy.id);
      return;
    }

    if (compare.length >= 2) return;
    addToCompare(policy);
    setShowCompareHint(false);
  };

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) {
    return (
      <p className="text-center mt-20 text-text-light dark:text-text-dark opacity-80">
        Loading policies...
      </p>
    );
  }
  if (error) {
    return <p className="text-center mt-20 text-red-500">{error}</p>;
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark px-6 py-10 max-w-6xl mx-auto text-text-light dark:text-text-dark transition-colors relative">
      <h1 className="text-2xl md:text-3xl font-bold mb-4 text-text-light dark:text-text-dark">
        All Policies
      </h1>

      {showCompareHint && (
        <div className="mb-6 rounded-xl border border-amber-200/70 dark:border-amber-800/50 bg-amber-50/80 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-800">
          Please select two policies of the same type and then click
          "Compare Now".
        </div>
      )}

      {/* FILTERS */}
      <div className="bg-card-light dark:bg-card-dark rounded-2xl p-4 border border-border-light dark:border-border-dark shadow-sm flex flex-col md:flex-row gap-4 md:items-center justify-between mb-6 transition-colors">
        {/* TYPE FILTER */}
        <div className="flex gap-2 text-xs">
          {["all", "health", "term-life", "whole-life"].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-4 py-2 rounded-full border transition font-semibold ${
                typeFilter === type
                  ? "bg-primary-light text-white border-primary-light"
                  : "bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark border-border-light dark:border-border-dark hover:bg-hover-light dark:hover:bg-hover-dark"
              }`}
            >
              {type === "all"
                ? "All"
                : type === "health"
                ? "Health"
                : type === "term-life"
                ? "Term Life"
                : "Whole Life"}
            </button>
          ))}
        </div>

        {/* SORT */}
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="text-xs border border-border-light dark:border-border-dark rounded-lg px-3 py-2 bg-card-light dark:bg-card-dark hover:bg-hover-light dark:hover:bg-hover-dark transition-colors"
        >
          <option value="recommended">Recommended</option>
          <option value="premium_low">Lowest Premium</option>
          <option value="coverage_high">Highest Coverage</option>
        </select>
      </div>

      {/* GRID */}
      {filtered.length === 0 ? (
        <p className="text-text-light dark:text-text-dark opacity-80 text-center mt-10 text-sm">
          No policies found for this category.
        </p>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {paged.filter(Boolean).map((p) => (
            <div
              key={p.id}
              className="relative bg-card-light dark:bg-card-dark rounded-2xl p-6 border border-border-light dark:border-border-dark shadow-sm hover:shadow-md transition"
            >
              {/* HEADER */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheckIcon className="w-6 h-6 text-blue-600" />
                    <h2 className="font-semibold text-text-light dark:text-text-dark">
                      {p.policy_name || "Policy"}
                    </h2>
                  </div>

                  <p className="text-xs text-text-light dark:text-text-dark opacity-80 -mt-1">
                    Provided by: {p.company_name || "Unknown"}
                  </p>
                </div>

                {/* SAVE BTN */}
                <button
                  onClick={() => toggleSave(p.id)}
                  title={
                    saved.includes(p.id)
                      ? "Click to remove this policy from Saved Policies."
                      : "Click here to save this policy for your Saved Policies page."
                  }
                >
                  {saved.includes(p.id) ? (
                    <BookmarkSlashIcon className="w-5 h-5 text-red-500" />
                  ) : (
                    <BookmarkIcon className="w-5 h-5 text-slate-400 dark:text-slate-500 hover:text-blue-600" />
                  )}
                </button>
              </div>

              {/* TYPE TAG */}
              <span className="inline-block px-3 py-1 text-[10px] font-semibold rounded-full bg-primary-light/10 dark:bg-primary-dark/20 text-primary-light dark:text-primary-dark border border-primary-light/30 dark:border-primary-dark/30 mb-3">
                {String(p.insurance_type || "").toUpperCase()}
              </span>

              {/* DESCRIPTION */}
              <p className="text-xs text-text-light dark:text-text-dark opacity-80 h-12 line-clamp-2 mb-3">
                {p.policy_description || "No description available"}
              </p>

              {/* DETAILS */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-light dark:text-text-dark opacity-80">
                    Personalized Premium:
                  </span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    Rs. {fmt(effectivePremium(p))}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-text-light dark:text-text-dark opacity-80">
                    Coverage:
                  </span>
                  <span className="font-semibold text-text-light dark:text-text-dark">
                    Rs. {fmt(p.coverage_limit)}
                  </span>
                </div>

                {p.company_rating && (
                  <div className="flex justify-between">
                    <span className="text-text-light dark:text-text-dark opacity-80">
                      Rating:
                    </span>
                    <span className="font-semibold flex items-center gap-1">
                      <StarIcon className="w-4 h-4 text-yellow-500" />
                      {p.company_rating}
                    </span>
                  </div>
                )}
              </div>

              {/* FOOTER BUTTONS */}
              <div className="mt-5 flex flex-col gap-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      if (!ensureKycApproved()) return;

                      const ownedRequest = ownedMap[String(p.id)];
                      if (ownedRequest) {
                        navigate(`/client/payment?request=${ownedRequest}`);
                        return;
                      }
                      navigate(`/client/buy?policy=${p.id}`);
                    }}
                    className="px-4 py-2 rounded-lg font-semibold bg-primary-light text-white hover:bg-primary-dark"
                  >
                    {ownedMap[String(p.id)] ? "Renew Now" : "Buy Now"}
                  </button>

                  <button
                    onClick={() => toggleSelect(p)}
                    className={`w-full flex items-center justify-center gap-2 text-sm font-semibold rounded-lg py-2 transition ${
                      compare.some((policy) => String(policy.id) === String(p.id))
                        ? "bg-primary-light text-white border border-primary-light shadow-sm dark:bg-primary-dark dark:border-primary-dark"
                        : "bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark border border-border-light dark:border-border-dark hover:bg-hover-light dark:hover:bg-hover-dark"
                    }`}
                  >
                    <ArrowsRightLeftIcon className="w-4 h-4" />
                    {compare.some((policy) => String(policy.id) === String(p.id))
                      ? "Selected"
                      : "Compare"}
                  </button>
                </div>

                <button
                  onClick={() => navigate(`/policy/${p.id}`)}
                  className="text-primary-light dark:text-primary-dark font-semibold hover:underline text-left"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PAGINATION */}
      {filtered.length > PAGE_SIZE && (
        <div className="flex justify-center items-center gap-2 mt-8 text-sm">
          <button
            className="px-3 py-1 rounded border border-border-light dark:border-border-dark disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Prev
          </button>
          {[...Array(pageCount)].map((_, idx) => {
            const num = idx + 1;
            return (
              <button
                key={num}
                className={`px-3 py-1 rounded border ${
                  page === num
                    ? "bg-primary-light text-white border-primary-light"
                    : "border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark"
                }`}
                onClick={() => setPage(num)}
              >
                {num}
              </button>
            );
          })}
          <button
            className="px-3 py-1 rounded border border-border-light dark:border-border-dark disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={page === pageCount}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

const hashToSeed = (value) => {
  let hash = 0;
  const str = String(value || "guest");
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) || 1;
};

const mulberry32 = (seed) => {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const buildRecommendedOrder = (list) => {
  const rawUser = sessionStorage.getItem("client_user");
  let userId = "guest";
  if (rawUser) {
    try {
      const parsed = JSON.parse(rawUser);
      userId = parsed?.id ?? parsed?._id ?? parsed?.user_id ?? "guest";
    } catch {
      userId = "guest";
    }
  }

  const seed = hashToSeed(userId);
  const rand = mulberry32(seed);
  const shuffled = [...list];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.map((p) => p.id);
};

export default AllPolicies;






