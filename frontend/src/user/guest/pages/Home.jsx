import React from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheckIcon,
  HeartIcon,
  ChartBarIcon,
  ArrowRightIcon,
  ClockIcon,
  UserGroupIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { useTheme } from "../../../context/ThemeContext";

const Home = () => {
  const { theme } = useTheme();
  const dark = theme === "dark";

  // Detect if client is logged in
  const isLoggedIn = !!localStorage.getItem("client_token");

  // Premium gradient using theme tokens
  const heroBg = dark
    ? "bg-gradient-to-br from-background-dark via-slate-900 to-slate-800 text-text-dark"
    : "bg-gradient-to-br from-background-light via-blue-50 to-indigo-50 text-text-light";

  const tintBg = {
    blue: "bg-blue-50 dark:bg-blue-900/30",
    purple: "bg-purple-50 dark:bg-purple-900/30",
    emerald: "bg-emerald-50 dark:bg-emerald-900/30",
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark transition-colors">

      {/* HERO SECTION */}
      <section className={`relative overflow-hidden ${heroBg}`}>
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-20 grid md:grid-cols-2 gap-10 items-center">

          {/* HERO LEFT */}
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card-light/20 dark:bg-card-dark/20 border border-border-light/40 dark:border-border-dark/40 text-sm">
              <SparklesIcon className="w-4 h-4" />
              Smart Digital Insurance Companion
            </span>

            <h1 className="mt-6 text-3xl md:text-5xl font-bold leading-tight">
              Compare & choose the best{" "}
              <span className="text-primary-light dark:text-primary-dark">insurance policy</span>{" "}
              in minutes.
            </h1>

            <p className="mt-4 text-sm md:text-base opacity-80 max-w-xl">
              BemaSathi helps you explore Health, Term Life, and Whole Life insurance
              policies from multiple companies, compare them side by side, and make smarter decisions.
            </p>

            {/* HERO BUTTONS */}
            <div className="mt-8 flex flex-wrap gap-4">

              {/* Browse Policies */}
              <Link
                to="/policies"
                className="
                  inline-flex items-center gap-2 px-6 py-3 rounded-lg 
                  bg-card-light dark:bg-card-dark
                  border border-border-light dark:border-border-dark
                  font-semibold shadow hover:bg-hover-light dark:hover:bg-hover-dark transition
                "
              >
                Browse Policies
                <ArrowRightIcon className="w-5 h-5" />
              </Link>

              {/* CONDITIONAL BUTTON */}
              {isLoggedIn ? (
                <Link
                  to="/client/dashboard"
                  className="
                    inline-flex items-center gap-2 px-6 py-3 rounded-lg 
                    border border-border-light dark:border-border-dark
                    text-text-light dark:text-text-dark
                    font-semibold hover:bg-hover-light dark:hover:bg-hover-dark transition
                  "
                >
                  Return to Dashboard
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="
                    inline-flex items-center gap-2 px-6 py-3 rounded-lg 
                    border border-border-light dark:border-border-dark
                    text-text-light dark:text-text-dark
                    font-semibold hover:bg-hover-light dark:hover:bg-hover-dark transition
                  "
                >
                  Login as Client
                </Link>
              )}

            </div>

            {/* HERO BADGES */}
            <div className="mt-6 flex flex-wrap gap-6 text-xs md:text-sm opacity-50">
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="w-5 h-5" />
                <span>Trusted companies</span>
              </div>
              <div className="flex items-center gap-2">
                <ChartBarIcon className="w-5 h-5" />
                <span>Smart comparison</span>
              </div>
              <div className="flex items-center gap-2">
                <ClockIcon className="w-5 h-5" />
                <span>Save time & effort</span>
              </div>
            </div>
          </div>

          {/* HERO RIGHT MOCK PANEL */}
          <div className="relative">
            <div className="rounded-2xl bg-card-light/80 dark:bg-card-dark/40 backdrop-blur border border-border-light dark:border-border-dark p-5 shadow-xl">
              <p className="text-sm opacity-80 mb-3 font-medium">
                Quick Insurance Snapshot
              </p>

              <div className="space-y-4 text-sm">
                {[
                  { name: "Health Insurance", detail: "From 4 providers", price: "Rs. 12,500+/year" },
                  { name: "Term Life", detail: "Long-term security", price: "Rs. 8,000+/year" },
                  { name: "Whole Life", detail: "Lifetime coverage", price: "Rs. 9,300+/year" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="
                      flex items-center justify-between 
                      bg-card-light dark:bg-card-dark rounded-xl p-3
                      border border-border-light dark:border-border-dark
                    "
                  >
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="opacity-70 text-xs">{item.detail}</p>
                    </div>
                    <p className="font-semibold">{item.price}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 text-xs opacity-70">
                * Demo data. Actual premiums depend on company and plan.
              </div>
            </div>

            <div className="absolute -bottom-6 -right-4 w-28 h-28 bg-primary-light/40 dark:bg-primary-dark/40 rounded-full blur-2xl opacity-60" />
          </div>
        </div>
      </section>

      {/* CATEGORY SECTION */}
      <section className="max-w-6xl mx-auto px-6 py-12 md:py-16">

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold">Browse by Insurance Type</h2>

          <Link
            to="/policies"
            className="text-sm text-primary-light dark:text-primary-dark font-medium hover:underline"
          >
            View all policies
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6 bg-white dark:bg-transparent rounded-2xl p-4 md:p-6">
          {[
            {
              type: "health",
              title: "Health Insurance",
              desc: "Cover medical bills, hospitalization, and treatments.",
              icon: HeartIcon,
              tint: "blue",
              theme: "text-blue-600 dark:text-blue-400",
            },
            {
              type: "term-life",
              title: "Term Life Insurance",
              desc: "High coverage at low premiums for a fixed term.",
              icon: ClockIcon,
              tint: "purple",
              theme: "text-purple-600 dark:text-purple-400",
            },
            {
              type: "whole-life",
              title: "Whole Life Insurance",
              desc: "Lifetime protection and long-term financial security.",
              icon: ShieldCheckIcon,
              tint: "emerald",
              theme: "text-emerald-600 dark:text-emerald-400",
            },
          ].map((item, i) => (
            <Link
              key={i}
              to={`/policies?type=${item.type}`}
              className="
                group bg-card-light dark:bg-card-dark rounded-2xl p-6 
                shadow-sm hover:shadow-md hover:-translate-y-0.5 transition
                border border-border-light dark:border-border-dark
              "
            >
              <div className={`w-10 h-10 rounded-xl ${tintBg[item.tint]} flex items-center justify-center mb-4`}>
                <item.icon className={`w-6 h-6 ${item.theme}`} />
              </div>

              <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
              <p className="text-sm opacity-80">{item.desc}</p>

              <div className={`mt-4 text-sm ${item.theme} flex items-center gap-1`}>
                Explore plans
                <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-card-light dark:bg-card-dark border-y border-border-light dark:border-border-dark">
        <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">How BemaSathi Works</h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: "Step 1", title: "Choose Insurance Type", desc: "Select Health, Term Life, or Whole Life to start." },
              { step: "Step 2", title: "View & Compare Policies", desc: "Compare two policies side-by-side." },
              { step: "Step 3", title: "Request Policy", desc: "Submit a buy request after KYC approval." },
            ].map((s, i) => (
              <div
                key={i}
                className="
                  rounded-2xl p-6
                  bg-background-light dark:bg-background-dark
                  border border-border-light dark:border-border-dark
                "
              >
                <p className="text-sm text-primary-light dark:text-primary-dark font-semibold mb-1">
                  {s.step}
                </p>
                <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-sm opacity-80">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY BEMASATHI */}
      <section className="max-w-6xl mx-auto px-6 py-12 md:py-16">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Why people prefer BemaSathi</h2>
            <p className="text-sm md:text-base opacity-80 mb-5">
              BemaSathi brings everything into one smart platform.
            </p>

            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <UserGroupIcon className="w-5 h-5 mt-0.5 text-primary-light dark:text-primary-dark" />
                <span>Compare policies from different companies.</span>
              </li>
              <li className="flex items-start gap-2">
                <ChartBarIcon className="w-5 h-5 mt-0.5 text-primary-light dark:text-primary-dark" />
                <span>Smart recommendation logic for clients.</span>
              </li>
              <li className="flex items-start gap-2">
                <ClockIcon className="w-5 h-5 mt-0.5 text-primary-light dark:text-primary-dark" />
                <span>Save time by doing everything online.</span>
              </li>
            </ul>
          </div>

          {/* CTA CARD */}
          <div className="bg-card-light dark:bg-card-dark rounded-2xl shadow-sm border border-border-light dark:border-border-dark p-6">
            <h3 className="text-lg font-semibold mb-4">
              Ready to explore policies?
            </h3>
            <p className="text-sm opacity-80 mb-6">
              Start as a guest or create a client account.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/policies"
                className="px-5 py-2.5 bg-primary-light text-white rounded-lg text-sm font-semibold hover:opacity-90 transition"
              >
                Continue as Guest
              </Link>
              <Link
                to="/register"
                className="
                  px-5 py-2.5 rounded-lg text-sm font-semibold
                  bg-card-light dark:bg-card-dark
                  border border-border-light dark:border-border-dark
                  hover:bg-hover-light dark:hover:bg-hover-dark
                "
              >
                Create Client Account
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;

