{kycStatus !== "approved" && (
  <div
    className="
      text-sm mb-4 p-4 rounded-xl border
      bg-red-50 dark:bg-red-900/20
      border-red-300 dark:border-red-700
      text-red-700 dark:text-red-300
      shadow-sm
    "
  >
    {/* DYNAMIC MESSAGE */}
    {kycStatus === "pending" && (
      <p className="font-medium">Your KYC is pending approval.</p>
    )}

    {kycStatus === "rejected" && (
      <p className="font-medium">Your KYC was rejected. Please resubmit.</p>
    )}

    {kycStatus === "not_submitted" && (
      <p className="font-medium">
        You must complete your KYC before purchasing a policy.
      </p>
    )}

    {/* UPDATE KYC BUTTON (FIXED FOR BOTH MODES) */}
    <button
      onClick={() => navigate("/client/kyc")}
      className="
        mt-3 px-4 py-2 rounded-lg text-xs font-semibold
        bg-primary-light text-white
        dark:bg-primary-dark dark:text-slate-900
        hover:brightness-110 dark:hover:brightness-125
        transition-all shadow-md
      "
    >
      Update KYC
    </button>
  </div>
)}