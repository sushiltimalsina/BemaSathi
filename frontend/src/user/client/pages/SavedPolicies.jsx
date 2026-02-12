import React, { useEffect, useState } from "react";
import API from "../../../api/api";
import { useNavigate } from "react-router-dom";
import useAuthSyncReady from "../../../hooks/useAuthSyncReady";
import { useCompare } from "../../../context/CompareContext";
import CompareBar from "../components/CompareBar";
import {
  ShieldCheckIcon,
  StarIcon,
  BookmarkSlashIcon,
  ArrowsRightLeftIcon,
} from "@heroicons/react/24/outline";
import { isRenewable } from "../../utils/renewal";

const SavedPolicies = () => {
  const navigate = useNavigate();
  const ready = useAuthSyncReady();

  // Require login
  const token = sessionStorage.getItem("client_token");
  const isClient = ready && !!token;

  const [savedItems, setSavedItems] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [ownedMap, setOwnedMap] = useState({});
  const [kycStatus, setKycStatus] = useState("loading");
  const [kycAllowEdit, setKycAllowEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const { compare, addToCompare, removeFromCompare } = useCompare();
  const fmt = (n) =>
    Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

  // Fetch logged-in user (age-based calculations)
  useEffect(() => {
    if (!ready) return;
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
  }, [isClient, ready, navigate, token]);

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

  useEffect(() => {
    if (!isClient) return;
    const fetchOwned = async () => {
      try {
        const res = await API.get("/my-requests", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const map = {};
        (res.data || []).forEach((req) => {
          if (req.policy_id) {
            map[String(req.policy_id)] = req;
          }
        });
        setOwnedMap(map);
      } catch (err) {
        console.error("Owned requests fetch failed", err);
        setOwnedMap({});
      }
    };
    fetchOwned();
  }, [isClient, token]);

  useEffect(() => {
    if (!isClient) return;
    const fetchKycStatus = async () => {
      try {
        const res = await API.get("/kyc/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
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
    fetchKycStatus();
  }, [isClient, token]);

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

  const ensureKycApproved = () => {
    if (kycStatus === "approved" && !kycAllowEdit) {
      return true;
    }
    navigate("/client/kyc");
    return false;
  };

  // SELECT FOR COMPARE
  const toggle = (policy) => {
    if (!ready || !isClient) return navigate("/login");

    const idStr = String(policy.id);
    if (compare.some((p) => String(p.id) === idStr)) {
      removeFromCompare(policy.id);
      return;
    }
    addToCompare(policy);
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

              <button
                onClick={() => remove(p.id)}
                title="Click to remove this policy from Saved Policies."
              >
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
                  Rs. {fmt(p.adjusted)}
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
            <div className="mt-5 flex flex-col gap-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    if (!ensureKycApproved()) return;

                    const ownedRequest = ownedMap[String(p.id)];
                    if (ownedRequest) {
                      if (!isRenewable(ownedRequest)) {
                        if (!ensureKycApproved()) return;
                        navigate(`/client/buy?policy=${p.id}`);
                        return;
                      }
                      navigate(`/client/payment?request=${ownedRequest.id}`);
                      return;
                    }
                    navigate(`/client/buy?policy=${p.id}`);
                  }}
                  className="px-4 py-2 rounded-lg font-semibold bg-primary-light text-white hover:bg-primary-dark"
                >
                  {ownedMap[String(p.id)]
                    ? isRenewable(ownedMap[String(p.id)])
                      ? "Renew Now"
                      : "Buy Again"
                    : "Buy Now"}
                </button>

                <button
                  onClick={() => toggle(p)}
                  className={`w-full flex items-center justify-center gap-2 text-sm font-semibold rounded-lg py-2 transition ${
                    compare.some(
                      (policy) => String(policy.id) === String(p.id)
                    )
                      ? "bg-primary-light text-white border border-primary-light shadow-sm dark:bg-primary-dark dark:border-primary-dark"
                      : "bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark border border-border-light dark:border-border-dark hover:bg-hover-light dark:hover:bg-hover-dark"
                  }`}
                >
                  <ArrowsRightLeftIcon className="w-4 h-4" />
                  {compare.some(
                    (policy) => String(policy.id) === String(p.id)
                  )
                    ? "Selected"
                    : "Compare"}
                </button>
              </div>

              <button
                onClick={() => navigate(`/policy/${p.id}`)}
                className="text-blue-600 dark:text-blue-400 hover:underline font-semibold text-left"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
      <CompareBar />
    </div>
  );
};

export default SavedPolicies;






