import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import ThemeToggle from "./ThemeDropdown";

const GuestNavbar = ({ isDark, mode, onToggleMode }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  const navLinks = [
    { to: "/policies", label: "Policies" },
    { to: "/compare", label: "Compare" },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact Us" },
    { to: "/faq", label: "FAQ" },
  ];

  return (
    <nav
      className="
        sticky top-0 z-50
        bg-nav-light/70 dark:bg-nav-dark/70
        backdrop-blur-md
        text-text-light dark:text-text-dark
        border-b border-border-light dark:border-border-dark
        transition-colors duration-300
      "
    >
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center">

        {/* LEFT: LOGO */}
        <Link
          to="/"
          className="text-2xl font-bold text-primary-light dark:text-primary-dark flex items-center space-x-2"
        >
          <img src="/logo.png" alt="BeemaSathi Logo" className="h-8 w-8" />
          <span>BeemaSathi</span>
        </Link>

        {/* RIGHT: NAV ITEMS (Desktop) */}
        <div className="hidden md:flex items-center space-x-6 font-medium ml-auto">

          {navLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="hover:text-primary-light dark:hover:text-primary-dark"
            >
              {item.label}
            </Link>
          ))}

          <ThemeToggle
            mode={mode}
            isDark={isDark}
            onToggle={onToggleMode}
          />

          <Link to="/login" className="hover:text-primary-light dark:hover:text-primary-dark">
            Login
          </Link>

          <Link
            to="/register"
            className="
              px-4 py-1.5 rounded-full
              bg-primary-light dark:bg-primary-dark
              text-white shadow-sm
              hover:opacity-90 transition
            "
          >
            Get started
          </Link>
        </div>

        {/* RIGHT: MOBILE */}
        <div className="md:hidden ml-auto flex items-center gap-2">
          <ThemeToggle
            mode={mode}
            isDark={isDark}
            onToggle={onToggleMode}
          />

          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="
              p-2 rounded-lg border border-border-light dark:border-border-dark
              bg-card-light dark:bg-card-dark
              text-text-light dark:text-text-dark
              focus:outline-none focus:ring-2 focus:ring-primary-light/60
            "
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? (
              <XMarkIcon className="w-5 h-5" />
            ) : (
              <Bars3Icon className="w-5 h-5" />
            )}
          </button>
        </div>

      </div>

      {/* MOBILE MENU */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark">
          <div className="px-6 py-4 space-y-3">
            {navLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={closeMobile}
                className="block py-2 text-sm font-medium hover:text-primary-light dark:hover:text-primary-dark"
              >
                {item.label}
              </Link>
            ))}

            <div className="flex flex-col gap-8 pt-2">
              <Link
                to="/login"
                onClick={closeMobile}
                className="text-sm font-semibold hover:text-primary-light dark:hover:text-primary-dark text-left"
              >
                Login
              </Link>

              <Link
                to="/register"
                onClick={closeMobile}
                className="
                  w-FULL max-w-[100px] mr-auto text-center px-3 py-2 rounded-lg text-sm font-semibold
                  bg-primary-light dark:bg-primary-dark text-white
                  shadow-sm hover:opacity-90 transition
                "
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default GuestNavbar;
