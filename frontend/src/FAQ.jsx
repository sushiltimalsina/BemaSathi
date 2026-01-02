import React, { useState } from "react";

const faqs = [
  {
    question: "How do I compare insurance policies?",
    answer: (
      <div className="space-y-3 leading-relaxed text-sm">
        <p>
          BeemaSathi uses a structured and intelligent comparison system to help
          you evaluate insurance policies based on multiple criteria:
        </p>

        <ul className="list-disc ml-5 space-y-1">
          <li><strong>Premium</strong> — Determines how much you pay annually.</li>
          <li><strong>Coverage Limit</strong> — Maximum benefit the policy offers.</li>
          <li><strong>Company Rating</strong> — Trust score from real customers.</li>
          <li><strong>Suitability Score</strong> — Fit based on your age, budget, and profile.</li>
          <li><strong>Medical Condition Match</strong> — Policies that cover your health risks.</li>
          <li><strong>Smoker Adjustment</strong> — Pricing adjusted for smoking habits.</li>
        </ul>

        <p>
          When comparing two policies, the system assigns a point for each
          category where one policy performs better. The policy with more points
          becomes the recommended choice.
        </p>

        <p>
          You can view a full breakdown inside the comparison page with
          detailed explanations for each scored metric.
        </p>
      </div>
    ),
  },
  {
    question: "How is my premium calculated?",
    answer:
      "Premium is affected by age, coverage amount, insurance type, medical history, and whether you are a smoker or non-smoker.",
  },
  {
    question: "Why do smoker users get different recommendations?",
    answer:
      "Insurance companies charge higher premiums for smokers due to increased medical risk. Our system adjusts recommendations accordingly.",
  },
  {
    question: "Is BemaSathi safe to use?",
    answer:
      "Yes. Your personal details are encrypted and never shared with third parties. Only verified agents can contact you after your request.",
  },
  {
    question: "What documents do I need to buy a policy?",
    answer:
      "Typically: citizenship, passport-size photo, medical reports (if required), and payment details for premium.",
  },
  {
    question: "Can I save policies to compare later?",
    answer:
      "Yes. Logged-in users can save policies and revisit them anytime from the Saved Policies section.",
  },
  {
    question: "How does BemaSathi choose the best policy for me?",
    answer:
      "Using your age, budget, smoking habits, and health conditions, we run scoring on all policies and select the best-matching ones.",
  },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (i) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark px-6 py-12">
      <div className="max-w-3xl mx-auto">

        {/* HEADER */}
        <h1 className="text-3xl font-bold text-center mb-4">
          Frequently Asked Questions
        </h1>
        <p className="text-center text-sm opacity-70 mb-10">
          Find answers to common questions about comparisons, policies, and using BemaSathi.
        </p>

        {/* FAQ LIST */}
        <div className="space-y-4">
          {faqs.map((item, i) => (
            <div
              key={i}
              className="border border-border-light dark:border-border-dark rounded-xl bg-card-light dark:bg-card-dark p-4"
            >
              <button
                className="w-full flex justify-between items-center text-left"
                onClick={() => toggle(i)}
              >
                <span className="font-semibold text-base">{item.question}</span>
                <span className="text-xl">{openIndex === i ? "−" : "+"}</span>
              </button>

              {openIndex === i && (
                <div className="mt-4 text-sm opacity-90">{item.answer}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQ;
