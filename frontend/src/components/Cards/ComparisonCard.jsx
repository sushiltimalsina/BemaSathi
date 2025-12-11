import React from "react";

// Simple wrapper for comparison layouts
const ComparisonCard = ({ children }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow border">{children}</div>
  );
};

export default ComparisonCard;
