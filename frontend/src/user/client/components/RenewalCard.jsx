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
  const renewalDate =
    request.next_renewal_date ||
    request.nextRenewalDate ||
    request.renewal_date ||
    request.renewalDate ||
    null;
  const amount = request.cycle_amount;
  const status = request.renewal_status;
  const isRenewable = status === "active" || status === "due";
  const formatDate = (value) => {
    if (!value) return "Not set";
    const dt = new Date(
      typeof value === "string" && value.length <= 10
        ? `${value}T00:00:00`
        : value
    );
    if (Number.isNaN(dt.getTime())) return "Invalid date";
    return dt.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  const daysLeft = () => {
    if (!renewalDate) return null;
    const today = new Date();
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const target = new Date(
      typeof renewalDate === "string" && renewalDate.length <= 10
        ? `${renewalDate}T00:00:00`
        : renewalDate
    );
    if (Number.isNaN(target.getTime())) return null;
    const diff = (target - startOfToday) / (1000 * 60 * 60 * 24);
    return Math.ceil(diff);
  };

  const daysLeftLabel = () => {
    const remaining = daysLeft();
    if (remaining === null) return "-";
    if (remaining < 0) return `Expired ${Math.abs(remaining)} days ago`;
    if (remaining === 0) return "Due today";
    return `${remaining} days left`;
  };

  const handleRenew = () => {
    navigate(`/client/payment?request=${request.id}`);
  };

  const handleDetails = () => {
    if (!request.policy_id) return;
    navigate(
      `/policy/${request.policy_id}?owned=1&buyRequest=${request.id}`,
      { state: { owned: true, buyRequestId: request.id } }
    );
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
          <span className="font-semibold">
            {formatDate(renewalDate)}
          </span>
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
          <span className={urgentColor}>{daysLeftLabel()}</span>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={handleRenew}
          disabled={!isRenewable}
          className="
            w-full py-3 rounded-xl font-semibold text-white 
            bg-gradient-to-r from-primary-light to-primary-dark
            shadow-[0_8px_20px_rgba(0,0,0,0.15)]
            hover:translate-y-[-1px] hover:shadow-[0_12px_28px_rgba(0,0,0,0.22)]
            active:translate-y-0
            transition
            disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none
          "
        >
          Renew Now
        </button>

        <button
          onClick={handleDetails}
          disabled={!request.policy_id}
          className="
            w-full py-3 rounded-xl font-semibold
            border border-border-light dark:border-border-dark
            bg-card-light dark:bg-card-dark
            shadow-inner
            hover:bg-hover-light dark:hover:bg-hover-dark
            hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)]
            transition
            disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
          "
        >
          Details
        </button>
      </div>

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
