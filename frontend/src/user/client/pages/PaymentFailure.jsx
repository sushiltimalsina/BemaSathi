import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ExclamationTriangleIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import API from "../../../api/api";

const PaymentFailure = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const paymentId = query.get("payment");
  const [cancelMessage, setCancelMessage] = useState("");

  useEffect(() => {
    const markCancelledIfPending = async () => {
      if (!paymentId) return;
      try {
        const res = await API.get(`/payments/${paymentId}`);
        const status = (res.data?.status || "").toLowerCase();
        if (status === "pending") {
          await API.post(`/payments/${paymentId}/cancel`);
          setCancelMessage("Payment marked as cancelled.");
        }
      } catch (err) {
        // ignore
      }
    };
    markCancelledIfPending();
  }, [paymentId]);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark px-6 py-12 flex items-center">
      <div className="max-w-xl mx-auto bg-card-light dark:bg-card-dark rounded-2xl shadow border border-border-light dark:border-border-dark p-8">
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
          <ExclamationTriangleIcon className="w-8 h-8" />
          <h1 className="text-2xl font-bold">Payment Failed</h1>
        </div>

        <p className="text-sm text-text-light dark:text-text-dark mb-3">
          We couldn&apos;t process your payment via eSewa. If any amount was deducted, it should be
          reversed automatically. You can retry the payment or contact support if this keeps
          happening.
        </p>

        {paymentId && (
          <p className="text-xs text-text-light dark:text-text-dark mb-4">
            Reference: <span className="font-semibold">{paymentId}</span>
          </p>
        )}
        {cancelMessage && (
          <p className="text-xs text-green-600 dark:text-green-400 mb-3">
            {cancelMessage}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border-light dark:border-border-dark hover:bg-hover-light dark:hover:bg-hover-dark transition"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back
          </button>
          <button
            onClick={() =>
              navigate(paymentId ? `/client/payment?payment=${paymentId}` : "/client/payment")
            }
            className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition"
          >
            Retry Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure;
