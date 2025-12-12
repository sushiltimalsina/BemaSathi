import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../../../api/api";
import {
  ArrowLeftIcon,
  BanknotesIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const query = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );

  const requestId = query.get("request");
  const paymentId = query.get("payment");

  const [loading, setLoading] = useState(true);
  const [buyRequest, setBuyRequest] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const fmt = (n) =>
    Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

  const computeCycleAmount = (br) => {
    if (!br) return 0;
    if (br.cycle_amount) return br.cycle_amount;
    const base = br.calculated_premium || 0;
    switch (br.billing_cycle) {
      case "monthly":
        return base / 12;
      case "quarterly":
        return base / 4;
      case "half_yearly":
        return base / 2;
      default:
        return base;
    }
  };

  const redirectToEsewa = (redirectUrl, payload) => {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = redirectUrl;
    form.target = "_self";

    Object.entries(payload || {}).forEach(([key, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
    form.remove();
  };

  useEffect(() => {
    if (!requestId && !paymentId) {
      setError("Invalid request ID.");
      setLoading(false);
      return;
    }
    if (requestId) {
      loadRequestByBuyRequest(requestId);
    } else if (paymentId) {
      loadRequestByPayment(paymentId);
    }
  }, [requestId, paymentId]);

  const loadRequestByBuyRequest = async (reqId) => {
    try {
        const res = await API.get("/my-requests");
        const req = res.data.find((r) => r.id === Number(reqId));

      if (!req) {
        setError("Request not found.");
        setLoading(false);
        return;
      }

        setBuyRequest(req);
        setPolicy(req.policy);
    } catch (err) {
      console.error(err);
      setError("Unable to load payment details.");
    }
    setLoading(false);
  };

  const loadRequestByPayment = async (payId) => {
    try {
      const res = await API.get(`/payments/${payId}`);
      const payment = res.data;

      if (!payment?.buy_request_id || !payment?.buy_request) {
        setError("Payment is missing request details.");
        setLoading(false);
        return;
      }

      setBuyRequest(payment.buy_request);
      setPolicy(payment.policy || payment.buy_request?.policy || {});
    } catch (err) {
      console.error(err);
      setError("Unable to load payment details.");
    }
    setLoading(false);
  };

  const handlePayment = async () => {
    setPaying(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await API.post("/payments/esewa", {
        buy_request_id: buyRequest.id,
        billing_cycle: buyRequest.billing_cycle,
      });

      const { redirect_url, payload } = res.data || {};

      if (redirect_url && payload) {
        setSuccessMsg("Redirecting to eSewa...");
        redirectToEsewa(redirect_url, payload);
      } else {
        setError("Payment initiation failed. Try again.");
      }
    } catch (err) {
      console.error(err);
      setError("Payment initiation failed. Try again.");
    }

    setPaying(false);
  };

  const handleKhaltiPayment = async () => {
    setPaying(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await API.post("/payments/khalti", {
        buy_request_id: buyRequest.id,
        billing_cycle: buyRequest.billing_cycle,
      });

      if (res.data?.payment_url) {
        setSuccessMsg("Redirecting to Khalti...");
        window.location.href = res.data.payment_url;
      } else {
        setError("Payment initiation failed. Try again.");
      }
    } catch (err) {
      console.error(err);
      const apiMsg = err?.response?.data?.message;
      setError(apiMsg || "Payment initiation failed. Try again.");
    }

    setPaying(false);
  };

  if (loading)
    return (
      <p className="text-center mt-10 text-text-light dark:text-text-dark">
        Loading payment page...
      </p>
    );

  if (error)
    return (
      <p className="text-center mt-10 text-red-500 dark:text-red-400">
        {error}
      </p>
    );

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark px-6 py-10 max-w-3xl mx-auto text-text-light dark:text-text-dark">
      {/* BACK */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 mb-6 opacity-70 hover:opacity-100 transition"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        Back
      </button>

      <h1 className="text-3xl font-bold mb-6">Complete Your Payment</h1>

      <div className="bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark shadow p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <ShieldCheckIcon className="w-7 h-7 text-primary-light dark:text-primary-dark" />
          <h2 className="text-xl font-bold">{policy.policy_name}</h2>
        </div>

        <p className="text-sm opacity-80 mb-2">Company: {policy.company_name}</p>

        <div className="mt-4 p-4 rounded-lg bg-hover-light dark:bg-hover-dark border border-border-light dark:border-border-dark">
          <p className="text-sm">Amount to Pay Now:</p>
          <p className="text-2xl font-bold mt-1">
            Rs. {fmt(computeCycleAmount(buyRequest))}
          </p>
          {buyRequest.billing_cycle && (
            <p className="text-xs opacity-70 mt-1">
              Billing Cycle: {buyRequest.billing_cycle.replace("_", " ")}
            </p>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between text-sm">
          <span>Status:</span>
          <span className="font-semibold capitalize">{buyRequest.status}</span>
        </div>
      </div>

      {/* SUCCESS + ERROR */}
      {successMsg && (
        <p className="text-green-600 dark:text-green-400 mb-3 font-medium">
          {successMsg}
        </p>
      )}
      {error && (
        <p className="text-red-500 dark:text-red-400 mb-3 font-medium">
          {error}
        </p>
      )}

      {/* PAY BUTTON */}
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={handlePayment}
          disabled={paying}
          className={`w-full py-3 rounded-lg text-white font-semibold flex items-center justify-center gap-2 transition
            ${paying ? "bg-green-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}
        >
          <BanknotesIcon className="w-5 h-5" />
          {paying ? "Processing..." : "Pay with eSewa"}
        </button>

        <button
          onClick={handleKhaltiPayment}
          disabled={paying}
          className={`w-full py-3 rounded-lg text-white font-semibold flex items-center justify-center gap-2 transition
            ${paying ? "bg-rose-400 cursor-not-allowed" : "bg-rose-600 hover:bg-rose-700"}`}
        >
          <BanknotesIcon className="w-5 h-5" />
          {paying ? "Processing..." : "Pay with Khalti"}
        </button>
      </div>
    </div>
  );
};

export default PaymentPage;
