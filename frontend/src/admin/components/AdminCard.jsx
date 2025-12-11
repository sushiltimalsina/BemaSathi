import React from "react";

const AdminCard = ({ title, value, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="
        w-full text-left p-5 rounded-xl
        bg-card-light dark:bg-card-dark
        border border-border-light dark:border-border-dark
        shadow-sm hover:shadow-lg
        hover:bg-hover-light dark:hover:bg-hover-dark
        hover:-translate-y-1
        hover:ring-4 hover:ring-primary-light/20 dark:hover:ring-primary-dark/25
        transition-all duration-300 ease-out
        cursor-pointer
      "
    >
      <h3 className="text-lg font-semibold mb-1 text-text-light dark:text-text-dark">
        {title}
      </h3>

      <p className="text-3xl font-bold text-primary-light dark:text-primary-dark">
        {value}
      </p>
    </button>
  );
};

export default AdminCard;
