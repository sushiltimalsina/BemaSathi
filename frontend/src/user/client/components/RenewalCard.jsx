import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ClockIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

const RenewalCard = ({ request }) => {
  const navigate = useNavigate();

  const cycle = request.billing_cycle?.replace("_", " ");
  const renewalDate = request.next_renewal_date;
  const amount = request.cycle_amount;
  const status = request.renewal_status;

  const daysLeft = () => {
    if (!renewalDate) return null;
    const diff =
      (new Date(renewalDate) - new Date()) / (1000 * 60 * 60 * 24);
    return Math.ceil(diff);
  };

  const handleRenew = () => {
    navigate(`/client/payment?request=${request.id}`);
  };

  // STATUS BADGE COLORS
  const statusClass = {
    active:
      "bg-green-500/20 text-green-600 dark:text-green-300 border-green-500/30",
    due: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30",
    expired:
      "bg-red-500/20 text-red-600 dark:text-red-300 border-red-500/30",
  }[status] || "bg-gray-500/20 text-gray-500 dark:text-gray-300";

  // URGENCY COLOR
  const urgentColor =
    daysLeft() <= 3 ? "text-red-500 font-bold" : "text-text-light dark:text-text-dark";

  return (
    <div
      className="
      relative p-6 rounded-2xl bg-white/60 dark:bg-black/30 backdrop-blur-xl
      border border-border-light dark:border-border-dark shadow-[0_8px_20px_rgba(0,0,0,0.15)]
      hover:shadow-[0_12px_25px_rgba(0,0,0,0.25)] transition-all duration-300
    "
    >
      {/* HEADER */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <ShieldCheckIcon className="w-6 h-6 text-primary-light dark:text-primary-dark" />
          <h2 className="text-lg font-bold">
            {request.policy?.policy_name}
          </h2>
        </div>

        <span
          className={`
            px-3 py-1 rounded-full text-xs font-semibold border
            ${statusClass}
          `}
        >
          {status?.toUpperCase()}
        </span>
      </div>

      <p className="text-sm opacity-60 mb-4">
        {request.policy?.company_name}
      </p>

      {/* DETAILS */}
      <div className="space-y-3 text-sm">
        {/* BILLING CYCLE */}
        <div className="flex justify-between">
          <span className="flex items-center gap-2 opacity-75">
            <ClockIcon className="w-4 h-4" />
            Billing Cycle:
          </span>
          <span className="font-semibold capitalize">{cycle}</span>
        </div>

        {/* NEXT RENEWAL */}
        <div className="flex justify-between">
          <span className="flex items-center gap-2 opacity-75">
            <ClockIcon className="w-4 h-4" />
            Next Renewal Date:
          </span>
          <span className="font-semibold">{renewalDate || "-"}</span>
        </div>

        {/* AMOUNT */}
        <div className="flex justify-between">
          <span className="flex items-center gap-2 opacity-75">
            <ArrowPathIcon className="w-4 h-4" />
            Renewal Amount:
          </span>
          <span className="font-semibold">Rs. {amount}</span>
        </div>

        {/* DAYS LEFT */}
        <div className="flex justify-between">
          <span className="flex items-center gap-2 opacity-75">
            <ExclamationTriangleIcon className="w-4 h-4" />
            Days Left:
          </span>
          <span className={urgentColor}>
            {daysLeft() !== null ? `${daysLeft()} days` : "-"}
          </span>
        </div>
      </div>

      {/* RENEW BUTTON */}
      {(status === "active" || status === "due") && (
        <button
          onClick={handleRenew}
          className="
            mt-6 w-full py-3 rounded-xl font-semibold text-white 
            bg-gradient-to-r from-primary-light to-primary-dark
            hover:opacity-90 active:scale-95 shadow-md transition
          "
        >
          Renew Now
        </button>
      )}

      {/* EXPIRED NOTICE */}
      {status === "expired" && (
        <p className="mt-4 text-red-500 text-sm font-semibold text-center">
          Policy expired — renewal unavailable.
        </p>
      )}
    </div>
  );
};

export default RenewalCard;
