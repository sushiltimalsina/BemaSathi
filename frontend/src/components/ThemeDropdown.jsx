import React, { useState, useEffect, useRef } from "react";
import {
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { useTheme } from "../context/ThemeContext";

const ThemeDropdown = () => {
  const { mode, setMode } = useTheme();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const options = [
    { value: "light", label: "Light", icon: <SunIcon className="w-4 h-4" /> },
    { value: "dark", label: "Dark", icon: <MoonIcon className="w-4 h-4" /> },
    {
      value: "system",
      label: "System",
      icon: <ComputerDesktopIcon className="w-4 h-4" />,
    },
  ];

  const current = options.find((o) => o.value === mode);

  // ⛔ FIX 1 — Use mousedown (works reliably)
  useEffect(() => {
    function handleOutside(e) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* BUTTON */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="
          flex items-center gap-1 px-3 py-1.5 rounded-lg 
          border border-border-light dark:border-border-dark 
          bg-card-light dark:bg-card-dark 
          hover:bg-hover-light dark:hover:bg-hover-dark 
          transition text-sm text-text-light dark:text-text-dark
        "
      >
        {current.icon}
        <span className="capitalize">{current.label}</span>
        <ChevronDownIcon className="w-4 h-4 opacity-70" />
      </button>

      {/* DROPDOWN */}
      {open && (
        <div
          className="
            absolute right-0 mt-2 w-36
            bg-card-light dark:bg-card-dark 
            border border-border-light dark:border-border-dark 
            shadow-lg rounded-lg z-50
          "
        >
          {options.map((o) => (
            <button
              key={o.value}
              onClick={() => {
                setMode(o.value);
                setOpen(false);
              }}
              className={`
                w-full flex items-center gap-2 px-3 py-2 text-left text-sm 
                hover:bg-hover-light dark:hover:bg-hover-dark transition
                ${
                  mode === o.value
                    ? "font-semibold text-primary-light dark:text-primary-dark"
                    : "text-text-light dark:text-text-dark"
                }
              `}
            >
              {o.icon}
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ThemeDropdown;
