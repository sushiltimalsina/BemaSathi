import React from "react";
import { Link } from "react-router-dom";

const getPolicyTitle = (policy) =>
  (policy && (policy.policy_name || policy.company_name)) || "Policy";

// Reusable policy card for guest/client listings
const PolicyCard = ({ policy, onSelect, selected }) => {
  return (
    <div className="bg-white p-5 rounded-lg shadow border hover:shadow-lg h-full flex flex-col">
      <h3 className="text-xl font-semibold text-blue-600 mb-2">
        {getPolicyTitle(policy)}
      </h3>
      {policy.policy_name && policy.company_name && (
        <p className="text-[11px] text-slate-500 mb-1">by {policy.company_name}</p>
      )}

      <p className="text-gray-700">
        <strong>Type:</strong> {policy.insurance_type}
      </p>

      <p className="text-gray-700">
        <strong>Premium:</strong> Rs. {policy.premium_amt}
      </p>

      <p className="text-gray-700 mb-3">
        <strong>Coverage:</strong> Rs. {policy.coverage_limit}
      </p>

      <Link
        to={`/policy/${policy.id}`}
        className="text-blue-600 hover:underline block mb-3"
      >
        View Details
      </Link>

      <div className="mt-auto">
        <button
          onClick={onSelect}
          className={`w-full py-2 rounded-md text-white font-semibold ${
            selected ? "bg-red-600" : "bg-blue-600"
          }`}
        >
          {selected ? "Remove" : "Select"}
        </button>
      </div>
    </div>
  );
};

export default PolicyCard;
