import React from "react";

const StatCard = ({ title, value, subtitle, icon: Icon, trend, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-xl p-5 shadow-sm transition ${
        onClick ? "cursor-pointer hover:shadow-md" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-light dark:text-muted-dark">
            {title}
          </p>
          <h3 className="text-2xl font-bold mt-1">
            {value}
          </h3>
        </div>

        {Icon && (
          <div className="p-3 rounded-lg bg-primary-light/10 dark:bg-primary-dark/20 text-primary-light dark:text-primary-dark">
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>

      {subtitle && (
        <p className="text-xs mt-3 text-muted-light dark:text-muted-dark">
          {subtitle}
        </p>
      )}

      {trend && (
        <p
          className={`text-xs mt-2 font-semibold ${
            trend > 0
              ? "text-green-600"
              : "text-red-600"
          }`}
        >
          {trend > 0 ? "▲" : "▼"} {Math.abs(trend)}%
        </p>
      )}
    </div>
  );
};

export default StatCard;
