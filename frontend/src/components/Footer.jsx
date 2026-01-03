import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  const scrollToTop = () => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer
      className="
        bg-card-light dark:bg-card-dark
        border-t border-border-light dark:border-border-dark
        mt-16
        transition-colors
      "
    >
      <div className="max-w-7xl mx-auto px-6 py-10 grid md:grid-cols-4 gap-10 text-sm">

        {/* BRAND */}
        <div>
          <h2 className="text-xl font-bold text-primary-light dark:text-primary-dark mb-3">
            BeemaSathi
          </h2>
          <p className="text-text-light dark:text-text-dark text-xs leading-relaxed opacity-80">
            Smart insurance comparison platform helping users choose better
            policies effortlessly.
          </p>
        </div>

        {/* QUICK LINKS */}
        <div>
          <h3 className="font-semibold text-text-light dark:text-text-dark mb-3">
            Quick Links
          </h3>
          <ul className="space-y-2 text-text-light dark:text-text-dark opacity-80">
            <li><Link to="/" onClick={scrollToTop} className="hover:opacity-100 transition">Home</Link></li>
            <li><Link to="/policies" onClick={scrollToTop} className="hover:opacity-100 transition">All Policies</Link></li>
            <li><Link to="/compare" onClick={scrollToTop} className="hover:opacity-100 transition">Compare</Link></li>
            <li><Link to="/login" onClick={scrollToTop} className="hover:opacity-100 transition">Login</Link></li>
          </ul>
        </div>

        {/* RESOURCES / INFO */}
        <div>
          <h3 className="font-semibold text-text-light dark:text-text-dark mb-3">
            Resources
          </h3>
          <ul className="space-y-2 text-text-light dark:text-text-dark opacity-80">
            <li><Link to="/about" onClick={scrollToTop} className="hover:opacity-100 transition">About Us</Link></li>
            <li><Link to="/contact" onClick={scrollToTop} className="hover:opacity-100 transition">Contact</Link></li>
            <li><Link to="/faq" onClick={scrollToTop} className="hover:opacity-100 transition">FAQ</Link></li>
            <li>
              <Link
                to="/policy-comparison-guide"
                onClick={scrollToTop}
                className="hover:opacity-100 transition"
              >
                Policy Comparison Guide
              </Link>
            </li>
          </ul>
        </div>

        {/* INSURANCE TYPES */}
        <div>
          <h3 className="font-semibold text-text-light dark:text-text-dark mb-3">
            Insurance Types
          </h3>

          <ul className="space-y-2 text-text-light dark:text-text-dark opacity-80">
            <li>
              <Link
                to="/policies?type=health"
                onClick={scrollToTop}
                className="hover:opacity-100 transition"
              >
                Health Insurance
              </Link>
            </li>

            <li>
              <Link
                to="/policies?type=term-life"
                onClick={scrollToTop}
                className="hover:opacity-100 transition"
              >
                Term Life Insurance
              </Link>
            </li>

            <li>
              <Link
                to="/policies?type=whole-life"
                onClick={scrollToTop}
                className="hover:opacity-100 transition"
              >
                Whole Life Insurance
              </Link>
            </li>
          </ul>
        </div>

      </div>

      {/* COPYRIGHT */}
      <div
        className="
          text-center py-4 text-xs
          text-text-light dark:text-text-dark opacity-70
          border-t border-border-light dark:border-border-dark
        "
      >
        © {new Date().getFullYear()} BeemaSathi. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
