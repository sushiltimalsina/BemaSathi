import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../../../api/api";
import {
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const query = new URLSearchParams(location.search);
  const paymentId = query.get("payment");

  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadPayment();
  }, [paymentId]);

  const loadPayment = async () => {
    if (!paymentId) {
      setError("Missing payment reference.");
      setLoading(false);
      return;
    }

    try {
      const res = await API.get(`/payments/${paymentId}`);
      setPayment(res.data);
    } catch (err) {
      console.error(err);
      setError("Unable to fetch payment details.");
    }

    setLoading(false);
  };

  if (loading)
    return (
      <p className="text-center mt-10 text-text-light dark:text-text-dark">
        Loading payment details…
      </p>
    );

  if (error)
    return (
      <p className="text-center mt-10 text-red-500 dark:text-red-400">{error}</p>
    );

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark px-6 py-10 max-w-3xl mx-auto text-text-light dark:text-text-dark">

      {/* BACK BUTTON */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 mb-6 opacity-70 hover:opacity-100 transition"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        Back
      </button>

      {/* SUCCESS CARD */}
      <div className="
        bg-card-light dark:bg-card-dark
        border border-border-light dark:border-border-dark
        shadow rounded-2xl p-8 text-center
      ">

        <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-4" />

        <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>

        <p className="opacity-80 text-sm max-w-md mx-auto">
          Your payment has been successfully completed.  
          Our team or assigned agent will contact you shortly.
        </p>

        {/* PAYMENT DETAILS */}
        <div className="
          mt-6 p-4 rounded-xl
          bg-hover-light dark:bg-hover-dark
          border border-border-light dark:border-border-dark
          text-left
        ">
          <p className="text-sm mb-2">
            <strong>Transaction ID:</strong> {payment.provider_reference || "N/A"}
          </p>
          <p className="text-sm mb-2">
            <strong>Amount Paid:</strong> रु. {payment.amount}
          </p>
          <p className="text-sm mb-2">
            <strong>Payment Method:</strong> {payment.provider.toUpperCase()}
          </p>
          <p className="text-sm">
            <strong>Status:</strong> {payment.status}
          </p>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row justify-center mt-8 gap-4">
          <button
            onClick={() => navigate("/client/dashboard")}
            className="px-5 py-3 rounded-lg bg-primary-light text-white font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"
          >
            Go to Dashboard
            <ArrowRightIcon className="w-5 h-5" />
          </button>

          <button
            onClick={() => navigate("/client/my-requests")}
            className="
              px-5 py-3 rounded-lg 
              bg-card-light dark:bg-card-dark 
              border border-border-light dark:border-border-dark
              hover:bg-hover-light dark:hover:bg-hover-dark
              font-semibold transition
            "
          >
            View My Requests
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
