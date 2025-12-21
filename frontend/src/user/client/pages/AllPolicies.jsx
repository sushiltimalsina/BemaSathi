import React, { useEffect, useState } from "react";
import API from "../../../api/api";
import { useNavigate, useLocation } from "react-router-dom";
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

  const location = useLocation();
  const navigate = useNavigate();

  const token = sessionStorage.getItem("client_token");
  const isClient = !!token;

  const getTypeFromQuery = () => {
    const params = new URLSearchParams(location.search);
    const type = params.get("type");
    return ["health", "term-life", "whole-life"].includes(type)
      ? type
      : "all";
  };

  const getCompareStartFromQuery = () => {
    const params = new URLSearchParams(location.search);
    return params.get("compareStart");
  };

  const [typeFilter, setTypeFilter] = useState(getTypeFromQuery);
  const [sortOption, setSortOption] = useState("none");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  const [selected, setSelected] = useState(() => {
    const start = getCompareStartFromQuery();
    return start ? [start] : [];
  });

  const [loading, setLoading] = useState(true);

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
    fetchSaved();
  }, []);

  // URL changes update filters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get("type");
    const cs = params.get("compareStart");

    setTypeFilter(["health", "term-life", "whole-life"].includes(t) ? t : "all");
    cs ? setSelected([cs]) : setSelected([]);
  }, [location.search]);

  // Re-filter when filters change
  useEffect(() => {
    applyFilters();
    setPage(1);
  }, [policies, typeFilter, sortOption]);

  const fetchPolicies = async () => {
    try {
      const res = await API.get("/policies");
      setPolicies(res.data || []);
    } catch (err) {
      console.error("Error loading policies:", err);
    }
    setLoading(false);
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

  const applyFilters = () => {
    let temp = [...policies];

    if (typeFilter !== "all") {
      temp = temp.filter((p) => p.insurance_type === typeFilter);
    }

    if (sortOption === "premium-low") {
      temp.sort((a, b) => effectivePremium(a) - effectivePremium(b));
    } else if (sortOption === "coverage-high") {
      temp.sort((a, b) => b.coverage_limit - a.coverage_limit);
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

  const toggleSelect = (id) => {
    // BLOCK GUESTS
    if (!isClient) {
      navigate("/login");
      return;
    }

    let newSelected;

    if (selected.includes(id)) {
      newSelected = selected.filter((x) => x !== id);
    } else {
      if (selected.length >= 2) return; // max 2 policies
      newSelected = [...selected, id];
    }

    setSelected(newSelected);
  };

  const compareSelected = () => {
    if (selected.length !== 2) return;
    navigate(`/client/compare?p1=${selected[0]}&p2=${selected[1]}`);
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

  const lastSelectedId = selected.length > 0 ? selected[selected.length - 1] : null;

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark px-6 py-10 max-w-6xl mx-auto text-text-light dark:text-text-dark transition-colors relative">
      <h1 className="text-2xl md:text-3xl font-bold mb-4 text-text-light dark:text-text-dark">
        All Policies
      </h1>

      {/* FILTERS */}
      <div className="bg-card-light dark:bg-card-dark rounded-2xl p-4 border border-border-light dark:border-border-dark shadow-sm flex flex-col md:flex-row gap-4 md:items-center justify-between mb-8 transition-colors">
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
          <option value="none">Sort By</option>
          <option value="premium-low">Premium (Low → High)</option>
          <option value="coverage-high">Coverage (High → Low)</option>
        </select>
      </div>

      {/* GRID */}
      {filtered.length === 0 ? (
        <p className="text-text-light dark:text-text-dark opacity-80 text-center mt-10 text-sm">
          No policies found for this category.
        </p>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {paged.map((p) => (
            <div
              key={p.id}
              className="relative bg-card-light dark:bg-card-dark rounded-2xl p-6 border border-border-light dark:border-border-dark shadow-sm hover:shadow-md transition"
            >
              {/* HEADER */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheckIcon className="w-6 h-6 text-blue-600" />
                    <h2 className="font-semibold">{p.policy_name}</h2>
                  </div>

                  <p className="text-xs text-text-light dark:text-text-dark opacity-80 -mt-1">
                    Provided by: {p.company_name}
                  </p>
                </div>

                {/* SAVE BTN */}
                <button onClick={() => toggleSave(p.id)}>
                  {saved.includes(p.id) ? (
                    <BookmarkSlashIcon className="w-5 h-5 text-red-500" />
                  ) : (
                    <BookmarkIcon className="w-5 h-5 text-slate-400 dark:text-slate-500 hover:text-blue-600" />
                  )}
                </button>
              </div>

              {/* TYPE TAG */}
              <span className="inline-block px-3 py-1 text-[10px] font-semibold rounded-full bg-primary-light/10 dark:bg-primary-dark/20 text-primary-light dark:text-primary-dark border border-primary-light/30 dark:border-primary-dark/30 mb-3">
                {p.insurance_type.toUpperCase()}
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
                  <span className="font-semibold">
                    रु. {fmt(effectivePremium(p))}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-text-light dark:text-text-dark opacity-80">
                    Coverage:
                  </span>
                  <span className="font-semibold">
                    रु. {fmt(p.coverage_limit)}
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
              <div className="mt-5 flex justify-between items-center text-xs">
                <button
                  onClick={() => navigate(`/policy/${p.id}`)}
                  className="text-primary-light dark:text-primary-dark font-semibold hover:underline"
                >
                  View Details
                </button>

                <button
                  onClick={() => toggleSelect(p.id)}
                  className={`px-4 py-2 rounded-lg border text-xs font-semibold transition ${
                    selected.includes(p.id)
                      ? "bg-primary-light text-white border-primary-light"
                      : "bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark border-border-light dark:border-border-dark hover:bg-hover-light dark:hover:bg-hover-dark"
                  }`}
                >
                  {selected.includes(p.id) ? "Selected" : "Compare"}
                </button>
              </div>

              {/* INLINE FLOATING COMPARE BUTTON INSIDE LAST SELECTED CARD */}
              {lastSelectedId === p.id && selected.length > 0 && (
                <div className="absolute -bottom-4 right-4">
                  <button
                    onClick={compareSelected}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold shadow-lg transition
                      ${
                        selected.length === 2
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-gray-300 text-gray-700 cursor-not-allowed"
                      }`}
                    disabled={selected.length !== 2}
                  >
                    <ArrowsRightLeftIcon className="w-4 h-4" />
                    {selected.length === 2
                      ? "Compare Selected Policies"
                      : `Select ${2 - selected.length} more`}
                  </button>
                </div>
              )}
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

export default AllPolicies;

