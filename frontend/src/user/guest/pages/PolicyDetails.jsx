import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import API from "../../../api/api";
import ClientLayout from "../../client/layout/ClientLayout";
import {
  ShieldCheckIcon,
  CurrencyRupeeIcon,
  ArrowLeftIcon,
  StarIcon,
  UserIcon,
  CheckCircleIcon,
  ArrowsRightLeftIcon,
  BookmarkIcon,
  BookmarkSlashIcon,
} from "@heroicons/react/24/outline";

const PolicyDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [kycStatus, setKycStatus] = useState(null);

  const token = sessionStorage.getItem("client_token");
  const isClient = !!token;
  const query = new URLSearchParams(location.search);
  const [ownedRequestId, setOwnedRequestId] = useState(
    location.state?.buyRequestId || query.get("buyRequest") || null
  );
  const ownedFlag =
    Boolean(location.state?.owned) || query.get("owned") === "1";
  const isOwned = ownedFlag || Boolean(ownedRequestId);

  useEffect(() => {
    fetchPolicy();
  }, [id]);

  useEffect(() => {
    const loadKyc = async () => {
      if (!isClient) return;
      try {
        const res = await API.get("/kyc/me");
        const list = res.data?.data || [];
        setKycStatus(list?.[0]?.status || "not_submitted");
      } catch (err) {
        console.error("KYC fetch failed", err);
        setKycStatus(null);
      }
    };

    loadKyc();
  }, [isClient]);

  // If user is logged in but no owned request passed, check if they already bought this policy.
  useEffect(() => {
    if (!isClient || ownedRequestId) return;

    const checkOwned = async () => {
      try {
        const res = await API.get("/my-requests");
        const match = (res.data || []).find(
          (r) => String(r.policy_id) === String(id)
        );
        if (match) {
          setOwnedRequestId(match.id);
        }
      } catch (err) {
        console.error("Owned policy check failed", err);
      }
    };

    checkOwned();
  }, [id, isClient, ownedRequestId]);

  useEffect(() => {
    const loadSaved = async () => {
      if (!isClient) return;
      try {
        const res = await API.get("/saved");
        const ids =
          Array.isArray(res.data) && res.data.length
            ? res.data.map((s) => String(s.policy_id))
            : [];
        setSaved(ids.includes(String(id)));
      } catch (err) {
        console.error("Saved fetch failed", err);
      }
    };
    loadSaved();
  }, [id, isClient]);

  const fetchPolicy = async () => {
    try {
      const res = await API.get(`/policies/${id}`);
      setPolicy(res.data);
    } catch (err) {
      console.error(err);
      setPolicy(null);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <p className="text-center mt-20 text-text-light dark:text-text-dark">
        Loading policy...
      </p>
    );
  }

  if (!policy) {
    return (
      <p className="text-center mt-20 text-red-500 dark:text-red-400">
        Policy not found or removed.
      </p>
    );
  }

  const fmt = (n) =>
    Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

  const guestMin = policy.premium_amt;
  const guestMax = policy.premium_amt * 3;
  const clientPremium =
    policy.personalized_premium ?? policy.premium_amt ?? guestMin;

  const handleRenewClick = () => {
    if (!isClient) {
      navigate("/login");
      return;
    }
    navigate(`/client/payment?request=${ownedRequestId}`);
  };

  const handleBuyClick = () => {
    if (!isClient) {
      navigate("/login");
      return;
    }
    if (kycStatus && kycStatus !== "approved") {
      navigate(`/client/kyc?policy=${policy.id}`);
      return;
    }
    navigate(`/client/buy?policy=${policy.id}`);
  };

  const toggleSave = async () => {
    if (!isClient) {
      navigate("/login");
      return;
    }
    try {
      if (saved) {
        await API.delete(`/saved/${policy.id}`);
        setSaved(false);
      } else {
        await API.post("/saved", { policy_id: policy.id });
        setSaved(true);
      }
    } catch (err) {
      console.error("Save toggle failed", err);
    }
  };

  const content = (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* BACK BUTTON */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 opacity-70 hover:opacity-100 transition mb-6"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        Back to policies
      </button>

      {/* TOP SECTION */}
      <div className="
        bg-card-light dark:bg-card-dark 
        rounded-2xl p-8 shadow-sm 
        border border-border-light dark:border-border-dark 
        mb-10
      ">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">

          {/* LEFT */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <ShieldCheckIcon className="w-7 h-7 text-primary-light dark:text-primary-dark" />
              <h1 className="text-2xl md:text-3xl font-bold">
                {policy.policy_name}
              </h1>
            </div>

            <p className="text-xs opacity-70 mb-1">
              Provided by {policy.company_name}
            </p>

            <span className="
              inline-block px-3 py-1 text-xs font-semibold rounded-full
              bg-primary-light/10 dark:bg-primary-dark/20
              text-primary-light dark:text-primary-dark
              border border-primary-light/30 dark:border-primary-dark/30
              mb-4
            ">
              {policy.insurance_type.toUpperCase()}
            </span>

            <p className="text-sm opacity-80 max-w-lg">
              {policy.policy_description || "No description provided for this policy."}
            </p>
          </div>

          {/* RIGHT SUMMARY */}
          <div className="
            bg-background-light dark:bg-background-dark 
            rounded-2xl px-6 py-4 
            border border-border-light dark:border-border-dark 
            shadow-sm 
            w-full md:w-60
          ">
            
            {/* PREMIUM */}
            <div className="mb-4">
              <p className="text-xs opacity-70">Premium</p>

              {isClient ? (
                <p className="text-lg font-semibold text-success-light dark:text-success-dark flex items-center gap-1">
                  रु. {fmt(clientPremium)}
                  <span className="block text-[10px] opacity-60 ml-1">
                    (personalized)
                  </span>
                </p>
              ) : (
                <p className="text-xl font-semibold">
                  रु. {fmt(guestMin)} - {fmt(guestMax)}
                  <span className="block text-[10px] opacity-60">
                    Login to see your exact premium
                  </span>
                </p>
              )}
            </div>

            {/* COVERAGE */}
            <div className="mb-4">
              <p className="text-xs opacity-70">Coverage Limit</p>
              <p className="text-xl font-semibold">
                रु. {fmt(policy.coverage_limit)}
              </p>
            </div>

            {/* RATING */}
            {policy.company_rating && (
              <div>
                <p className="text-xs opacity-70">Rating</p>
                <div className="flex items-center gap-1">
                  <StarIcon className="w-5 h-5 text-yellow-500" />
                  <span className="text-lg font-semibold">
                    {policy.company_rating}/5
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={toggleSave}
              className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border-light dark:border-border-dark text-xs font-semibold hover:bg-hover-light dark:hover:bg-hover-dark transition"
            >
              {saved ? (
                <>
                  <BookmarkSlashIcon className="w-4 h-4 text-red-500" />
                  Saved
                </>
              ) : (
                <>
                  <BookmarkIcon className="w-4 h-4" />
                  Save Policy
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div className="
        bg-card-light dark:bg-card-dark 
        rounded-2xl p-8 shadow-sm 
        border border-border-light dark:border-border-dark 
        mb-10
      ">
        <h2 className="text-xl font-bold mb-4">Key Features</h2>

        <ul className="space-y-3 text-sm">
          <li className="flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-primary-light dark:text-primary-dark" />
            Low premium with balanced coverage.
          </li>

          <li className="flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-primary-light dark:text-primary-dark" />
            Transparent terms and easy claim assistance.
          </li>

          <li className="flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-primary-light dark:text-primary-dark" />
            Trusted company with solid customer support.
          </li>

        </ul>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row gap-4">
        {!isOwned && (
          <button
            onClick={handleBuyClick}
            className="
              flex-1 px-5 py-3 rounded-lg
              bg-primary-light text-white font-semibold
              hover:opacity-90 transition
            "
          >
            Buy / Request
          </button>
        )}
        <button
          onClick={() =>
            isClient
              ? navigate(`/client/agent?policy=${policy.id}`)
              : navigate("/login")
          }
          className="
            flex items-center justify-center gap-2 px-5 py-3 rounded-lg
            bg-card-light dark:bg-card-dark
            border border-border-light dark:border-border-dark
            hover:bg-hover-light dark:hover:bg-hover-dark
            font-semibold transition
          "
        >
          <UserIcon className="w-5 h-5" />
          {isClient ? "View agent details" : "Login to view agent"}
        </button>

        {/* COMPARE */}
        <button
          onClick={() =>
            isClient
              ? navigate(`/client/policies?type=${policy.insurance_type}&compareStart=${policy.id}`)
              : navigate(`/policies?type=${policy.insurance_type}&compareStart=${policy.id}`)
          }
          className="
            flex items-center justify-center gap-2 px-5 py-3 rounded-lg
            bg-card-light dark:bg-card-dark
            border border-border-light dark:border-border-dark
            hover:bg-hover-light dark:hover:bg-hover-dark
            font-semibold transition
          "
        >
          <ArrowsRightLeftIcon className="w-5 h-5" />
          Compare with another policy
        </button>

        {isOwned && (
          <button
            onClick={handleRenewClick}
            className="
              flex-1 px-5 py-3 rounded-lg
              bg-primary-light text-white font-semibold
              hover:opacity-90 transition
            "
          >
            Renew Now
          </button>
        )}
      </div>
    </div>
  );

  if (isClient) {
    return <ClientLayout>{content}</ClientLayout>;
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark transition-colors">
      {content}
    </div>
  );
};

export default PolicyDetails;
