import React, { useEffect, useState } from "react";
import API from "../../../api/api";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheckIcon,
  CurrencyRupeeIcon,
  StarIcon,
  BookmarkSlashIcon,
  ArrowsRightLeftIcon,
} from "@heroicons/react/24/outline";

const SavedPolicies = () => {
  const navigate = useNavigate();

  // Require login
  const token = localStorage.getItem("client_token");
  const isClient = !!token;

  const [savedItems, setSavedItems] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const fmt = (n) =>
    Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

  // Fetch logged-in user (age-based calculations)
  useEffect(() => {
    if (!isClient) return navigate("/login");
    const loadUser = async () => {
      try {
        const res = await API.get("/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (e) {
        console.error(e);
      }
    };
    loadUser();
  }, []);

  // Fetch saved policies
  useEffect(() => {
    if (!user) return;

    const fetchSaved = async () => {
      setLoading(true);
      try {
        const res = await API.get("/saved", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const processed = (res.data || [])
          .map((item) => item.policy)
          .filter(Boolean)
          .map((policy) => ({
            ...policy,
            adjusted:
              policy.personalized_premium ?? policy.premium_amt ?? 0,
          }));

        setSavedItems(res.data || []);
        setPolicies(processed);
      } catch (e) {
        console.error("Saved fetch error:", e);
      }

      setLoading(false);
    };

    fetchSaved();
  }, [user, token]);

  // REMOVE SAVED
  const remove = async (id) => {
    try {
      await API.delete(`/saved/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPolicies((prev) => prev.filter((p) => p.id !== id));
      setSavedItems((prev) => prev.filter((s) => s.policy_id !== id));
    } catch (e) {
      console.error("Remove saved failed", e);
    }
  };

  // SELECT FOR COMPARE
  const toggle = (id) => {
    if (!isClient) return navigate("/login");
    if (selected.includes(id)) {
      return setSelected(selected.filter((x) => x !== id));
    }
    if (selected.length >= 2) return;
    setSelected([...selected, id]);
  };

  // GO COMPARE
  const compareNow = () => {
    if (selected.length !== 2) return;
    navigate(`/client/compare?p1=${selected[0]}&p2=${selected[1]}`);
  };

  // LOADING
  if (loading || !user)
    return (
      <p className="text-center mt-20 text-text-light dark:text-text-dark opacity-80">
        Loading saved policies...
      </p>
    );

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark px-6 py-10 max-w-6xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Saved Policies</h1>

      {/* NO SAVED */}
      {policies.length === 0 && (
        <div className="text-center mt-20">
          <p className="text-text-light dark:text-text-dark opacity-70 mb-5">
            You haven't saved any policies yet.
          </p>
          <button
            onClick={() => navigate("/client/policies")}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Browse Policies
          </button>
        </div>
      )}

      {/* POLICY GRID */}
      <div className="grid md:grid-cols-3 gap-6">
        {policies.map((p) => (
          <div
            key={p.id}
            className="bg-card-light dark:bg-card-dark rounded-2xl shadow-sm border border-border-light dark:border-border-dark p-6 hover:shadow-md transition"
          >
            {/* HEADER */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheckIcon className="w-6 h-6 text-blue-600" />
                  <h2 className="font-semibold">{p.policy_name}</h2>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-300">
                  {p.company_name}
                </p>
              </div>

              <button onClick={() => remove(p.id)}>
                <BookmarkSlashIcon className="w-5 h-5 text-red-500" />
              </button>
            </div>

            {/* TAG */}
            <span className="inline-block mb-3 px-3 py-1 text-[10px] font-semibold rounded-full bg-primary-light/10 dark:bg-primary-dark/20 text-primary-light dark:text-primary-dark border border-primary-light/30 dark:border-primary-dark/30 transition">
              {p.insurance_type.toUpperCase()}
            </span>

            {/* DESCRIPTION */}
            <p className="text-xs text-text-light dark:text-text-dark opacity-80 h-12 line-clamp-2 mb-3">
              {p.policy_description || "No description available."}
            </p>

            {/* DETAILS */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Premium</span>
                <span className="font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
                  <span className="font-bold">Rs.</span>
                  {fmt(p.adjusted)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Coverage</span>
                <span className="font-semibold">
                  Rs. {fmt(p.coverage_limit)}
                </span>
              </div>

              {p.company_rating && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Rating</span>
                  <span className="font-semibold flex items-center gap-1">
                    <StarIcon className="w-4 h-4 text-yellow-500" />
                    {p.company_rating}
                  </span>
                </div>
              )}
            </div>

            {/* ACTIONS */}
            <div className="mt-5 flex justify-between items-center text-xs">
              <button
                onClick={() => navigate(`/policy/${p.id}`)}
                className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              >
                View Details
              </button>

              <button
                onClick={() => toggle(p.id)}
                className={`px-3 py-1.5 rounded-lg border text-xs ${
                  selected.includes(p.id)
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-card-light dark:bg-card-dark border-border-light dark:border-border-dark hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {selected.includes(p.id) ? "Selected" : "Compare"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* COMPARE BUTTON */}
      {selected.length === 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md">
          <button
            onClick={compareNow}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-2xl font-semibold shadow-lg hover:bg-blue-700"
          >
            <ArrowsRightLeftIcon className="w-5 h-5" />
            Compare Selected Policies
          </button>
        </div>
      )}
    </div>
  );
};

export default SavedPolicies;




