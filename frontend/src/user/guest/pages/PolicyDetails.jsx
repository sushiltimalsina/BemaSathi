import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import API from "../../../api/api";
import {
  ShieldCheckIcon,
  CurrencyRupeeIcon,
  ArrowLeftIcon,
  StarIcon,
  UserIcon,
  CheckCircleIcon,
  ArrowsRightLeftIcon,
} from "@heroicons/react/24/outline";

const PolicyDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState(null);
  const [kycStatus, setKycStatus] = useState("checking");

  const token = localStorage.getItem("client_token");
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

  // Fetch KYC status for logged-in users so we can gate buying
  useEffect(() => {
    const loadKyc = async () => {
      if (!isClient) return;
      try {
        const res = await API.get("/kyc/me");
        const kyc = res.data?.data;
        const status = Array.isArray(kyc)
          ? kyc[0]?.status
          : kyc?.status;
        setKycStatus(status || "not_submitted");
      } catch (err) {
        console.error("KYC fetch failed", err);
        setKycStatus("not_submitted");
      }
    };
    loadKyc();
  }, [isClient]);

  const fetchPolicy = async () => {
    try {
      const res = await API.get(`/policies/${id}`);
      setPolicy(res.data);

      if (res.data.agent_id) {
        try {
          const agentRes = await API.get(`/agents/${res.data.agent_id}`);
          setAgent(agentRes.data);
        } catch (e) {
          console.error("Agent fetch failed", e);
        }
      }
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

  const handleBuyClick = () => {
    if (!isClient) {
      navigate("/login");
      return;
    }
    if (kycStatus !== "approved") {
      navigate("/client/kyc");
      return;
    }
    navigate(`/client/buy?policy=${policy.id}`);
  };

  const handleRenewClick = () => {
    if (!isClient) {
      navigate("/login");
      return;
    }
    if (!ownedRequestId) {
      handleBuyClick();
      return;
    }
    navigate(`/client/payment?request=${ownedRequestId}`);
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark transition-colors">
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

            {agent && (
              <li className="flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-primary-light dark:text-primary-dark" />
                Dedicated agent support available.
              </li>
            )}
          </ul>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row gap-4">

          {/* VIEW AGENT */}
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

          {/* PRIMARY ACTION: BUY or RENEW */}
          <button
            onClick={isOwned ? handleRenewClick : handleBuyClick}
            className="
              flex-1 px-5 py-3 rounded-lg
              bg-primary-light text-white font-semibold
              hover:opacity-90 transition
            "
          >
            {isOwned
              ? "Renew Now"
              : isClient
              ? "Buy / Request Callback"
              : "Login to buy"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PolicyDetails;
