import React from "react";
import { Link } from "react-router-dom";
import {
  CheckCircleIcon,
  ScaleIcon,
  CurrencyRupeeIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

const PolicyComparisonGuide = () => {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark px-6 py-12">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* HERO */}
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold">
            Policy Comparison Guide
          </h1>
          <p className="text-sm opacity-70 mt-3 max-w-2xl mx-auto">
            A quick, practical guide to compare insurance plans the right way.
            Use this to understand coverage, premium, and value before buying.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/compare"
              className="
                px-5 py-2 rounded-lg
                bg-primary-light text-white font-semibold
                hover:opacity-90 transition
              "
            >
              Start Comparing
            </Link>
            <Link
              to="/policies"
              className="
                px-5 py-2 rounded-lg
                bg-card-light dark:bg-card-dark
                border border-border-light dark:border-border-dark
                hover:bg-hover-light dark:hover:bg-hover-dark
                font-semibold transition
              "
            >
              Browse Policies
            </Link>
          </div>
        </div>

        {/* HOW IT WORKS */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-xl p-5 shadow-sm">
            <ScaleIcon className="w-6 h-6 text-primary-light dark:text-primary-dark" />
            <h3 className="font-semibold mt-3">Compare on key factors</h3>
            <p className="text-sm opacity-70 mt-2">
              Look beyond price. Compare coverage, exclusions, claims support,
              and policy flexibility.
            </p>
          </div>
          <div className="bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-xl p-5 shadow-sm">
            <CurrencyRupeeIcon className="w-6 h-6 text-primary-light dark:text-primary-dark" />
            <h3 className="font-semibold mt-3">Know what you pay</h3>
            <p className="text-sm opacity-70 mt-2">
              Premium should fit your budget and match your risk profile and
              coverage needs.
            </p>
          </div>
          <div className="bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-xl p-5 shadow-sm">
            <ShieldCheckIcon className="w-6 h-6 text-primary-light dark:text-primary-dark" />
            <h3 className="font-semibold mt-3">Pick the right insurer</h3>
            <p className="text-sm opacity-70 mt-2">
              Prefer companies with solid claim settlement and responsive
              service.
            </p>
          </div>
        </div>

        {/* CHECKLIST */}
        <div className="bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Comparison Checklist</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            {[
              "Coverage limit matches your risk",
              "Premium aligns with billing cycle",
              "Waiting period and exclusions are clear",
              "Co-pay and claim limits are acceptable",
              "Company rating and claim ratio are strong",
              "Policy includes your medical conditions",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2">
                <CheckCircleIcon className="w-5 h-5 text-primary-light dark:text-primary-dark mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SCORECARD */}
        <div className="bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Simple Scorecard</h2>
          <p className="text-sm opacity-70 mb-6">
            Rate each plan from 1-5 on these categories, then pick the highest
            total.
          </p>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            {[
              "Coverage quality",
              "Premium value",
              "Exclusions and limits",
              "Claim support",
              "Company reliability",
              "Renewal flexibility",
            ].map((item) => (
              <div
                key={item}
                className="border border-border-light dark:border-border-dark rounded-lg px-4 py-3"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER NOTE */}
        <div className="text-center text-xs opacity-70">
          Need help? Compare two plans or contact support for guidance.
        </div>
      </div>
    </div>
  );
};

export default PolicyComparisonGuide;
