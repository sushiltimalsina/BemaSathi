import React from "react";
import { ArrowLeftIcon, ShieldCheckIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

const AboutUs = () => {
  const navigate = useNavigate();

  return (
    <div
      className="
        min-h-screen 
        bg-background-light dark:bg-background-dark
        text-text-light dark:text-text-dark
        transition-colors px-6 py-10
      "
    >
      <div className="max-w-4xl mx-auto">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 opacity-70 hover:opacity-100 mb-6"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back
        </button>

        {/* Title */}
        <h1 className="text-3xl font-bold mb-6">About BemaSathi</h1>

        {/* Intro Card */}
        <div className="bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark shadow rounded-2xl p-8 mb-10">
          <p className="text-sm leading-relaxed opacity-90">
            BemaSathi is a modern insurance comparison platform designed to help
            Nepali customers find the best insurance policy quickly and easily.
            We remove confusion, eliminate misinformation, and give users the tools
            to make confident decisions.
          </p>
        </div>

        {/* Our Mission */}
        <Section
          title="Our Mission"
          icon={<ShieldCheckIcon className="w-7 h-7 text-primary-light dark:text-primary-dark" />}
          content="
            To make insurance simple, transparent, and accessible for every Nepali.
            We focus on clarity, user-friendly tools, and unbiased policy recommendations
            tailored to your needs.
          "
        />

        {/* What We Provide */}
        <Section
          title="What We Provide"
          icon={<SparklesIcon className="w-7 h-7 text-yellow-500" />}
          list={[
            "Side-by-side comparison of top insurance policies",
            "Personalized recommendations based on your profile",
            "Smart premium calculations based on age and preferences",
            "Verified agent support for documentation and claims",
            "Clean, distraction-free interface for easy decision making",
          ]}
        />

        {/* Our Vision */}
        <Section
          title="Our Vision"
          icon={<ShieldCheckIcon className="w-7 h-7 text-green-500" />}
          content="
            To become Nepal’s most trusted insurance intelligence platform — a place
            where every citizen confidently chooses the right policy without pressure,
            confusion, or hidden agendas.
          "
        />

        {/* Why Choose Us */}
        <Section
          title="Why Choose BemaSathi?"
          list={[
            "Honest and unbiased recommendations",
            "User-first design with dark/light mode support",
            "Data-driven comparison engine",
            "24/7 availability — no more agent dependency",
            "Zero extra cost to the user",
          ]}
        />
      </div>
    </div>
  );
};

/* Reusable Section Component */
const Section = ({ title, icon, content, list }) => {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>

      {/* Paragraph */}
      {content && (
        <p className="text-sm opacity-90 leading-relaxed pl-10">{content}</p>
      )}

      {/* Bullet List */}
      {list && (
        <ul className="text-sm opacity-90 space-y-2 pl-12 list-disc">
          {list.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AboutUs;
