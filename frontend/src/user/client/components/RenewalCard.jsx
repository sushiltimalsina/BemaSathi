import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ClockIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  UserIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import API from "../../../api/api";
import { getRenewalDate, isGraceExpired, isRenewable, getGraceDays } from "../../utils/renewal";
import Modal from "../../../components/Modal";

const RenewalCard = ({ request }) => {
  const navigate = useNavigate();
  const [downloading, setDownloading] = React.useState(false);
  const [modalConfig, setModalConfig] = React.useState({
    isOpen: false,
    title: "",
    message: "",
    type: "error"
  });

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
    navigate(`/client/payment?request=${request.hashed_id || request.id}`);
  };

  const handleBuyAgain = () => {
    const policyId = request.policy_id || request.policy?.id;
    if (!policyId) return;
    navigate(`/client/buy?policy=${policyId}`);
  };

  const handleDetails = () => {
    if (!request.policy_id) return;
    navigate(
      `/policy/${request.policy?.hashed_id || request.policy_id}?owned=1&buyRequest=${request.id}`,
      { state: { owned: true, buyRequestId: request.id } }
    );
  };

  const handleDownload = async (type, buyRequestId) => {
    if (!buyRequestId) return;
    const endpoint = type === 'policy' ? 'policy-document' : 'payment-receipt';
    setDownloading(true);
    try {
      const response = await API.get(`/buy-requests/${buyRequestId}/${endpoint}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_document.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed", err);
      setModalConfig({
        isOpen: true,
        title: "Download Failed",
        message: "We encountered an issue generating your document. Please try again in a few moments.",
        type: "error"
      });
    } finally {
      setDownloading(false);
    }
  };

  // STATUS BADGE COLORS
  const remainingDays = daysLeft();
  const graceDays = getGraceDays(request);
  const isGrace = remainingDays < 0 && Math.abs(remainingDays) <= graceDays;
  
  const effectiveStatus = graceExpired ? "expired" : (isGrace ? "due" : status);
  
  const statusClass = {
    active:
      "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    due: "bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20",
    expired:
      "bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20",
  }[effectiveStatus] || "bg-gray-500/10 text-gray-600 dark:text-gray-400";

  const urgentColor =
    daysLeft() <= 3
      ? "text-red-600 dark:text-red-400 font-semibold"
      : "text-text-light/70 dark:text-text-dark/70";

  return (
    <div
      className="
      relative p-6 rounded-3xl
      bg-card-light dark:bg-card-dark
      border border-border-light dark:border-border-dark
      shadow-md dark:shadow-2xl transition-all duration-300
      hover:border-primary-light/30
    "
    >
      {/* HEADER */}
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          <ShieldCheckIcon className="w-5 h-5 text-primary-light dark:text-primary-dark" />
          <h2 className="text-lg font-bold text-text-light dark:text-text-dark">
            {request.policy?.policy_name}
          </h2>
        </div>

        <span
          className={`
            px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter border
            ${statusClass}
          `}
        >
          {effectiveStatus === 'expired' ? 'EXPIRED' : (effectiveStatus || "-").toUpperCase()}
        </span>
      </div>

      <p className="text-xs text-muted-light dark:text-muted-dark font-medium mb-6">
        {request.policy?.company_name}
      </p>

      {/* DETAILS */}
      <div className="space-y-2.5 text-xs">
        {/* BILLING CYCLE */}
        <div className="flex justify-between">
          <span className="flex items-center gap-2 text-muted-light dark:text-muted-dark">
            <ClockIcon className="w-3.5 h-3.5" />
            Billing Cycle:
          </span>
          <span className="font-bold text-text-light dark:text-text-dark capitalize">{cycle}</span>
        </div>

        {/* NEXT RENEWAL */}
        <div className="flex justify-between">
          <span className="flex items-center gap-2 text-muted-light dark:text-muted-dark">
            <ClockIcon className="w-3.5 h-3.5" />
            Next Renewal Date:
          </span>
          <span className="font-bold text-text-light dark:text-text-dark">
            {formatDate(renewalDate)}
          </span>
        </div>

        {/* AMOUNT */}
        <div className="flex justify-between">
          <span className="flex items-center gap-2 text-muted-light dark:text-muted-dark">
            <ArrowPathIcon className="w-3.5 h-3.5" />
            Renewal Amount:
          </span>
          <span className="font-bold text-text-light dark:text-text-dark">
             रु. {fmt(amount)}
          </span>
        </div>

        {/* DAYS LEFT */}
        <div className="flex justify-between">
          <span className="flex items-center gap-2 text-muted-light dark:text-muted-dark">
            <ExclamationTriangleIcon className="w-3.5 h-3.5" />
            Days Left:
          </span>
          <span className={urgentColor}>{daysLeftLabel()}</span>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="mt-8 flex items-center gap-2">
        <button
          onClick={canRenew ? handleRenew : handleBuyAgain}
          className={`
            flex-1 py-3.5 rounded-2xl font-bold text-sm text-white
            ${canRenew ? 'bg-primary-light hover:bg-blue-700' : 'bg-indigo-600 hover:bg-indigo-700'}
            shadow-lg dark:shadow-[0_8px_20px_-4px_rgba(79,70,229,0.4)]
            transition-all active:scale-95
          `}
        >
          {canRenew ? "Renew Now" : "Buy Again"}
        </button>

        <button
          onClick={handleDetails}
          className="
            px-6 py-3.5 rounded-2xl font-bold text-xs text-text-light dark:text-text-dark
            bg-hover-light dark:bg-hover-dark border border-border-light dark:border-border-dark
            transition-all active:scale-95
          "
        >
          Details
        </button>

        {/* ONLY DOWNLOAD POLICY DOCUMENT FOR ACTIVE/DUE */}
        {effectiveStatus !== 'expired' && (
          <button
            onClick={() => handleDownload("policy", request.id)}
            disabled={downloading}
            className={`
              p-3.5 rounded-2xl bg-primary-light/10 dark:bg-primary-dark/10 hover:bg-primary-light/20 dark:hover:bg-primary-dark/20 border border-primary-light/30 dark:border-primary-dark/30
              text-primary-light dark:text-primary-dark transition-all active:scale-95
              ${downloading ? 'animate-pulse cursor-wait opacity-50' : ''}
            `}
            title="Download Policy Document"
          >
            {downloading ? (
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
            ) : (
              <DocumentTextIcon className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* EXPIRED NOTICE */}
      {(status === "expired" || graceExpired) && (
        <p className="mt-5 text-red-500/80 text-[10px] font-black tracking-wide text-center uppercase">
          Policy expired - renewal unavailable.
        </p>
      )}

      {isGrace && !graceExpired && (
        <p className="mt-5 text-amber-500/80 text-[10px] font-black tracking-wide text-center uppercase">
          Policy in grace period - renew now to avoid expiration.
        </p>
      )}

      {/* REMINDER NOTE */}
      <p className="mt-2 text-[9px] leading-relaxed text-slate-500 font-bold text-center px-4">
        Renewal reminders are sent by email and in-app notification. Late renewals
        can be blocked after the grace period.
      </p>

      {/* CUSTOM MODAL POPUP */}
      <Modal 
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />
    </div>
  );
};

export default RenewalCard;
