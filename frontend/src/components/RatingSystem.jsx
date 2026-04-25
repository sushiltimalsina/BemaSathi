import React, { useState } from "react";
import { StarIcon } from "@heroicons/react/24/solid";
import { StarIcon as StarOutline } from "@heroicons/react/24/outline";
import API from "../api/api";

const RatingSystem = ({ 
  policyId, 
  policyName,
  companyName,
  initialRating = 0, 
  onRatingUpdate, 
  onProceed, 
  actionLabel = "Submit Review" 
}) => {
  const [rating, setRating] = useState(initialRating);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return alert("Please select a star rating");
    setLoading(true);
    try {
      const res = await API.post("/ratings", {
        policy_id: policyId,
        rating: rating,
        review: review,
      });
      setSubmitted(true);
      if (onRatingUpdate) onRatingUpdate(res.data.average_rating);
      
      // If we have a proceed callback, wait 1s then proceed
      if (onProceed) {
        setTimeout(() => {
          onProceed();
        }, 1000);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit rating");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-800 text-center animate-in fade-in zoom-in duration-300">
        <h3 className="text-green-700 dark:text-green-400 font-bold">Thank you for your feedback!</h3>
        <p className="text-sm opacity-70">
          {onProceed ? "Redirecting to payment..." : "Your rating helps others choose the right policy."}
        </p>
      </div>
    );
  }

  return (
    <div className="text-center h-full flex flex-col justify-center px-2">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-text-light dark:text-text-dark line-clamp-1">
          {policyName || "Rate this Policy"}
        </h3>
        <p className="text-[10px] text-primary-light dark:text-primary-dark font-semibold uppercase tracking-wider">
          {companyName}
        </p>
      </div>

      <p className="text-[10px] opacity-60 mb-3 text-muted-light dark:text-muted-dark font-medium">How was your experience with this policy?</p>
      
      {/* STAR RATING */}
      <div className="flex items-center justify-center gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(star)}
            className="transition-all active:scale-90 hover:scale-110"
          >
            {star <= (hover || rating) ? (
              <StarIcon className="w-8 h-8 text-yellow-500" />
            ) : (
              <StarOutline className="w-8 h-8 text-gray-400 opacity-40" />
            )}
          </button>
        ))}
      </div>

      {/* REVIEW TEXT */}
      <textarea
        placeholder="Any review? (optional)"
        value={review}
        onChange={(e) => setReview(e.target.value)}
        className="w-full p-2 rounded-xl bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary-light outline-none text-[10px] mb-3 transition-all"
        rows="2"
      />

      <div className="flex flex-col gap-1.5">
        <button
          onClick={handleSubmit}
          disabled={loading || rating === 0}
          className="w-full py-2.5 bg-primary-light dark:bg-primary-dark text-white font-bold rounded-xl text-xs shadow-lg hover:opacity-90 disabled:opacity-50 transition-all active:scale-95"
        >
          {loading ? "Submitting..." : actionLabel}
        </button>

        {onProceed && (
          <button
            onClick={onProceed}
            className="w-full py-1 text-[10px] font-bold opacity-50 hover:opacity-100 transition-opacity"
          >
            Skip & Proceed
          </button>
        )}
      </div>
    </div>
  );
};

export default RatingSystem;
