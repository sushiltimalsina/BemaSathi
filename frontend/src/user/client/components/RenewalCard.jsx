import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ClockIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { getRenewalDate, isGraceExpired, isRenewable } from "../../utils/renewal";

const RenewalCard = ({ request }) => {
  const navigate = useNavigate();

  const cycle = request.billing_cycle?.replace("_", " ");
  const renewalDate = getRenewalDate(request);
  const amount = request.cycle_amount;
  const status = request.renewal_status;
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

  const graceExpired = isGraceExpired(request);
  const canRenew = isRenewable(request);

  const daysLeftLabel = () => {
    const remaining = daysLeft();
    if (remaining === null) return "-";
    if (remaining < 0) return `Expired ${Math.abs(remaining)} days ago`;
    if (remaining === 0) return "Due today";
    return `${remaining} days left`;
  };

  const fmt = (n) =>
    Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

  const handleRenew = () => {
    navigate(`/client/payment?request=${request.id}`);
  };

  const handleBuyAgain = () => {
    const policyId = request.policy_id || request.policy?.id;
    if (!policyId) return;
    navigate(`/client/buy?policy=${policyId}`);
  };

  const handleDetails = () => {
    if (!request.policy_id) return;
    navigate(
      `/policy/${request.policy_id}?owned=1&buyRequest=${request.id}`,
      { state: { owned: true, buyRequestId: request.id } }
    );
  };

  // STATUS BADGE COLORS
  const effectiveStatus = graceExpired ? "expired" : status;
  const statusClass = {
    active:
      "bg-green-500/20 text-green-600 dark:text-green-300 border-green-500/30",
    due: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30",
    expired:
      "bg-red-500/20 text-red-600 dark:text-red-300 border-red-500/30",
  }[effectiveStatus] || "bg-gray-500/20 text-gray-500 dark:text-gray-300";

  // URGENCY COLOR
  const urgentColor =
    daysLeft() <= 3
      ? "text-red-600 dark:text-red-400 font-semibold"
      : "text-text-light/80 dark:text-text-dark/80";

  return (
    <div
      className="
      relative p-6 rounded-2xl
      bg-card-light/80 dark:bg-card-dark/70
      border border-border-light dark:border-border-dark
      shadow-sm hover:shadow-md transition-all duration-300
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
          {(effectiveStatus || "-").toUpperCase()}
        </span>
      </div>

      <p className="text-sm text-text-light/60 dark:text-text-dark/60 mb-4">
        {request.policy?.company_name}
      </p>

      {/* DETAILS */}
      <div className="space-y-3 text-sm">
        {/* BILLING CYCLE */}
        <div className="flex justify-between">
          <span className="flex items-center gap-2 text-text-light/70 dark:text-text-dark/70">
            <ClockIcon className="w-4 h-4" />
            Billing Cycle:
          </span>
          <span className="font-semibold capitalize">{cycle}</span>
        </div>

        {/* NEXT RENEWAL */}
        <div className="flex justify-between">
          <span className="flex items-center gap-2 text-text-light/70 dark:text-text-dark/70">
            <ClockIcon className="w-4 h-4" />
            Next Renewal Date:
          </span>
          <span className="font-semibold">
            {formatDate(renewalDate)}
          </span>
        </div>

        {/* AMOUNT */}
        <div className="flex justify-between">
          <span className="flex items-center gap-2 text-text-light/70 dark:text-text-dark/70">
            <ArrowPathIcon className="w-4 h-4" />
            Renewal Amount:
          </span>
          <span className="font-semibold">रु. {fmt(amount)}</span>
        </div>

        {/* DAYS LEFT */}
        <div className="flex justify-between">
          <span className="flex items-center gap-2 text-text-light/70 dark:text-text-dark/70">
            <ExclamationTriangleIcon className="w-4 h-4" />
            Days Left:
          </span>
          <span className={urgentColor}>{daysLeftLabel()}</span>
        </div>
      </div>

      {/* AGENT CONTACT SECTION */}
      {request.policy?.agents && request.policy.agents.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border-light dark:border-border-dark">
          <p className="text-xs font-semibold text-text-light/70 dark:text-text-dark/70 mb-3 flex items-center gap-2">
            <UserIcon className="w-4 h-4" />
            Need Help? Contact Your Agent:
          </p>
          <div className="space-y-3">
            {request.policy.agents.slice(0, 2).map((agent) => (
              <div key={agent.id} className="bg-background-light/50 dark:bg-background-dark/50 p-3 rounded-lg">
                <p className="font-semibold text-sm">{agent.name}</p>
                {agent.phone && (
                  <p className="text-xs text-text-light/60 dark:text-text-dark/60 mt-1">
                    📞 {agent.phone}
                  </p>
                )}
                {agent.email && (
                  <p className="text-xs text-text-light/60 dark:text-text-dark/60">
                    ✉️ {agent.email}
                  </p>
                )}
                {agent.company?.name && (
                  <p className="text-xs text-text-light/50 dark:text-text-dark/50 mt-1">
                    {agent.company.name}
                  </p>
                )}
              </div>
            ))}
            {request.policy.agents.length > 2 && (
              <p className="text-xs text-primary-light dark:text-primary-dark font-medium">
                +{request.policy.agents.length - 2} more agent{request.policy.agents.length - 2 !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ACTIONS */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={canRenew ? handleRenew : handleBuyAgain}
          className="
            w-full py-3 rounded-xl font-semibold text-white
            bg-primary-light dark:bg-primary-dark
            hover:bg-primary-light/90 dark:hover:bg-primary-dark/90
            transition
          "
        >
          {canRenew ? "Renew Now" : "Buy Again"}
        </button>

        <button
          onClick={handleDetails}
          disabled={!request.policy_id}
          className="
            w-full py-3 rounded-xl font-semibold
            border border-border-light dark:border-border-dark
            bg-card-light dark:bg-card-dark
            hover:bg-hover-light dark:hover:bg-hover-dark
            transition
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          Details
        </button>
      </div>

      {/* EXPIRED NOTICE */}
      {status === "expired" && (
        <p className="mt-4 text-red-500 text-sm font-semibold text-center">
          Policy expired - renewal unavailable.
        </p>
      )}
      {status !== "expired" && graceExpired && (
        <p className="mt-4 text-red-500 text-sm font-semibold text-center">
          Grace period ended - renewal unavailable. Please apply again for a new policy or contact our support team if reinstatement is possible.
        </p>
      )}

      {/* REMINDER NOTE */}
      <p className="mt-4 text-xs text-text-light/60 dark:text-text-dark/60 text-center">
        Renewal reminders are sent by email and in-app notification. Late renewals
        can be blocked after the grace period.
      </p>
    </div>
  );
};

export default RenewalCard;
