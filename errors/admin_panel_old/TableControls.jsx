import React from "react";

const TableControls = ({
  search,
  onSearchChange,
  sortKey,
  sortDir,
  onSortChange,
  sortOptions = [],
  placeholder = "Search...",
}) => {
  const toggleSort = (key) => {
    if (sortKey !== key) {
      onSortChange({ key, dir: "asc" });
    } else {
      onSortChange({ key, dir: sortDir === "asc" ? "desc" : "asc" });
    }
  };

  return (
    <div className="table-controls">
      <input
        type="text"
        className="table-search"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={placeholder}
      />

      {sortOptions.length > 0 && (
        <div className="sort-buttons">
          {sortOptions.map((opt) => (
            <button
              key={opt.key}
              type="button"
              className={`btn btn-secondary btn-sm ${
                sortKey === opt.key ? "active" : ""
              }`}
              onClick={() => toggleSort(opt.key)}
              title="Toggle sort"
            >
              {opt.label}
              {sortKey === opt.key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TableControls;
