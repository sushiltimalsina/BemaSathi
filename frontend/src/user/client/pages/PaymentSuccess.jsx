import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../../../api/api";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowRightIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);

  const paymentId = query.get("payment");

  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState("");

  const fmt = (n) =>
    Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
  const prettyDate = (value) => {
    if (!value) return "-";
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return value;
    return dt.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  useEffect(() => {
    if (!paymentId) {
      setError("Invalid payment reference.");
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const res = await API.get(`/payments/${paymentId}`);
        setPayment(res.data);
      } catch (err) {
        console.error(err);
        setError("Unable to load payment details.");
      }
      setLoading(false);
    };

    load();
  }, [paymentId]);

  if (loading)
    return (
      <div className="text-center mt-20 text-text-light dark:text-text-dark">
        Processing payment result...
      </div>
    );

  if (error)
    return (
      <div className="text-center mt-20 text-red-500 dark:text-red-400">
        {error}
      </div>
    );

  if (!payment)
    return (
      <div className="text-center mt-20 text-text-light dark:text-text-dark">
        Payment details unavailable.
      </div>
    );

  const status = (payment.status || "").toLowerCase();
  const br = payment.buy_request || payment.buyRequest;
  const policy = br?.policy || payment.policy;

  const statusUI =
    {
      success: {
        icon: <CheckCircleIcon className="w-14 h-14 text-green-500" />,
        title: "Payment Successful",
        subtitle: "Your policy payment was completed successfully.",
      },
      completed: {
        icon: <CheckCircleIcon className="w-14 h-14 text-green-500" />,
        title: "Payment Successful",
        subtitle: "Your policy payment was completed successfully.",
      },
      failed: {
        icon: <XCircleIcon className="w-14 h-14 text-red-500" />,
        title: "Payment Failed",
        subtitle: "The payment could not be completed.",
      },
      pending: {
        icon: <ClockIcon className="w-14 h-14 text-yellow-500" />,
        title: "Payment Pending",
        subtitle: "Your payment is being verified.",
      },
    }[status] || {
      icon: <ClockIcon className="w-14 h-14 text-yellow-500" />,
      title: "Payment Status",
      subtitle: "Awaiting payment confirmation.",
    };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark">
      <div
        className="
          max-w-xl w-full p-8 rounded-2xl
          bg-white/70 dark:bg-black/40 backdrop-blur-xl
          border border-border-light dark:border-border-dark
          shadow-[0_10px_30px_rgba(0,0,0,0.2)]
        "
      >
        {/* STATUS */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            {statusUI.icon}
          </div>
          <h1 className="text-2xl font-bold">{statusUI.title}</h1>
          <p className="opacity-70 mt-1">{statusUI.subtitle}</p>
        </div>

        {/* DETAILS */}
        <div className="mt-8 space-y-4 text-sm">
          <Detail label="Policy" value={policy?.policy_name} />
          <Detail label="Company" value={policy?.company_name} />
          <Detail label="Amount Paid" value={`Rs. ${fmt(payment.amount)}`} />
          <Detail
            label="Billing Cycle"
            value={br?.billing_cycle?.replace("_", " ")}
          />
          <Detail
            label="Next Renewal Date"
            value={prettyDate(br?.next_renewal_date)}
          />
          <Detail
            label="Payment Method"
            value={
              (payment.method ||
                payment.payment_method ||
                payment.provider ||
                ""
              ).toString().toUpperCase() || "-"
            }
          />
          {(payment.transaction_id || payment.provider_reference) && (
            <Detail
              label="Transaction ID"
              value={payment.transaction_id || payment.provider_reference}
            />
          )}
        </div>

        {/* ACTIONS */}
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => navigate("/client/my-policies")}
            className="
              w-full py-3 rounded-xl font-semibold text-white
              bg-linear-to-r from-primary-light to-primary-dark
              shadow-[0_8px_20px_rgba(0,0,0,0.2)]
              hover:-translate-y-px hover:shadow-[0_10px_25px_rgba(0,0,0,0.25)]
              active:translate-y-0
              transition
            "
          >
            <span className="flex items-center justify-center gap-2">
              Go to My Policies
              <ArrowRightIcon className="w-5 h-5" />
            </span>
          </button>

          <button
            onClick={() => navigate("/client/payments")}
            className="
              w-full py-3 rounded-xl font-semibold
              border border-border-light dark:border-border-dark
              bg-card-light dark:bg-card-dark
              shadow-inner
              hover:bg-hover-light dark:hover:bg-hover-dark
              hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)]
              transition
            "
          >
            <span className="flex items-center justify-center gap-2">
              View Payments
              <DocumentTextIcon className="w-5 h-5" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

const Detail = ({ label, value }) => (
  <div className="flex justify-between border-b border-border-light dark:border-border-dark pb-2">
    <span className="opacity-70">{label}</span>
    <span className="font-semibold text-right">{value || "-"}</span>
  </div>
);

export default PaymentSuccess;
